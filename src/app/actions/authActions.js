'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function isSupabaseOfflineError(error) {
  if (!error) return false
  const msg = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase()
  const status = error.status || error.code
  return (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('service unavailable') ||
    msg.includes('bad gateway') ||
    msg.includes('paused') ||
    msg.includes('connection') ||
    msg.includes('network') ||
    msg.includes('timeout')
  )
}

/**
 * Server Action to securely authenticate an employee using NIP as the username and password.
 * Automatically provisions a Supabase Auth user and links it to the employee profile if not already present.
 */
export async function nipLoginAction(nip, password) {
  try {
    const supabase = await createClient()

    // 1. Validate inputs
    if (!nip || !password) {
      return { error: "NIP dan Password harus diisi." }
    }

    // 2. Fetch employee profile by NIP from public directory
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, email, auth_id, name, is_password_enabled')
      .eq('nip', nip)
      .single()

    if (empError) {
      console.error("NIP Login - DB error:", empError)
      if (isSupabaseOfflineError(empError)) {
        return { error: "Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server." }
      }
      return { error: "NIP tidak terdaftar dalam direktori pegawai resmi atau terjadi kesalahan koneksi. Silakan hubungi Admin." }
    }

    if (!employee) {
      return { error: "NIP tidak terdaftar dalam direktori pegawai resmi. Silakan hubungi Admin." }
    }

    // Enforce password == NIP only for first-time auto-provisioning to prevent hijack
    if (!employee.auth_id && password !== nip) {
      return { error: "Untuk aktivasi pertama kali, silakan masukkan password yang sama dengan NIP Anda." }
    }

    // 3. Security Check: If they have a linked account but NIP login is disabled
    if (employee.auth_id && employee.is_password_enabled === false) {
      return { 
        error: "Fitur login password NIP dinonaktifkan untuk akun Anda. Silakan masuk menggunakan tombol 'Lanjutkan dengan Google' atau aktifkan kembali fitur ini melalui Pengaturan Akun di Dashboard Anda." 
      }
    }

    const authEmail = employee.email || `${nip}@sicerdas.local`;

    // 4. Attempt standard sign in using email & NIP as password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password
    })

    if (!signInError) {
      // If successful, verify if the auth_id mapping and status is synced
      const updates = {}
      if (employee.auth_id !== signInData.user.id) updates.auth_id = signInData.user.id
      if (employee.is_password_enabled !== true) updates.is_password_enabled = true

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('employees')
          .update(updates)
          .eq('id', employee.id)
      }
      return { success: true }
    }

    // Log sign-in error for debugging purposes in server console
    console.log("NIP Auth Sign-In Error details:", { message: signInError.message, status: signInError.status })

    if (isSupabaseOfflineError(signInError)) {
      return { error: "Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server." }
    }

    // 5. If sign-in fails because the user account/password is not provisioned yet, let's register them!
    const isInvalidCreds = signInError.message.toLowerCase().includes('invalid') || 
                          signInError.message.toLowerCase().includes('credential') || 
                          signInError.message.toLowerCase().includes('not found') || 
                          signInError.status === 400 || 
                          signInError.status === 404;

    if (isInvalidCreds && !employee.auth_id) {
      let signUpData, signUpError;

      // Use Admin API to bypass email rate limits and avoid sending confirmation emails if Service Key is available
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          serviceKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        
        const response = await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: employee.name
          }
        });
        signUpData = { user: response.data.user };
        signUpError = response.error;
      } else {
        // Fallback to standard signUp if no Service Key is configured
        const response = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              username: employee.name
            }
          }
        });
        signUpData = response.data;
        signUpError = response.error;
      }

      if (signUpError) {
        if (isSupabaseOfflineError(signUpError)) {
          return { error: "Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server." }
        }
        const errMsg = signUpError.message.toLowerCase()
        // If email is already taken, they might have previously logged in with Google OAuth
        if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
          return { error: "Email pegawai ini sudah terdaftar via Google. Silakan masuk menggunakan tombol 'Lanjutkan dengan Google' atau minta Admin untuk mengaktifkan kembali login NIP untuk Anda." }
        }
        return { error: `Gagal membuat kredensial: ${signUpError.message}` }
      }

      // Check for silent signup failure (user exists but identities are empty)
      const isSilentFailure = !signUpData?.user || 
                             (signUpData.user.identities && signUpData.user.identities.length === 0);
      
      if (isSilentFailure) {
        return { error: "Akun ini sudah terdaftar (kemungkinan via Google). Silakan masuk menggunakan tombol 'Lanjutkan dengan Google' atau hubungi Admin untuk mengaktifkan password NIP Anda." }
      }

      if (signUpData?.user) {
        // Link the newly created auth user ID and enable NIP login status in employees table
        await supabase
          .from('employees')
          .update({ 
            auth_id: signUpData.user.id,
            is_password_enabled: true 
          })
          .eq('id', employee.id)

        // Sign in again to establish standard cookies/session context
        const { error: finalSignInError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password
        })

        if (finalSignInError) {
          if (isSupabaseOfflineError(finalSignInError)) {
            return { error: "Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server." }
          }
          return { error: `Akun berhasil didaftarkan tetapi gagal masuk: ${finalSignInError.message}` }
        }

        return { success: true }
      }
    }

    if (signInError.message.toLowerCase().includes('invalid login credentials') || 
        signInError.message.toLowerCase().includes('invalid credential')) {
      return { error: "NIP atau Password kustom salah. Silakan coba lagi." }
    }

    return { error: `Gagal masuk: ${signInError.message}` }
  } catch (error) {
    console.error("nipLoginAction exception:", error)
    if (isSupabaseOfflineError(error)) {
      return { error: "Server database (Supabase) sedang tidak aktif/hibernasi karena tidak digunakan. Silakan hubungi Admin untuk mengaktifkan kembali server." }
    }
    return { error: `Gagal masuk: ${error.message || error}` }
  }
}

/**
 * Server Action to toggle the NIP password login functionality for an employee profile.
 * - Users can change it for themselves via their active authenticated session.
 * - Administrators can manage other users if SUPABASE_SERVICE_ROLE_KEY is configured.
 */
export async function toggleNipPasswordAction(employeeId, enable, customPassword = null) {
  const supabase = await createClient()

  // 1. Get current logged in user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return { error: "Not authenticated" }

  // 2. Fetch both profiles (current user and target employee)
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', currentUser.id)
    .single()

  const { data: targetEmployee } = await supabase
    .from('employees')
    .select('id, nip, auth_id')
    .eq('id', employeeId)
    .single()

  if (!targetEmployee) return { error: "Pegawai tidak ditemukan." }

  const isSelf = currentEmployee?.id === targetEmployee.id
  const isAdmin = currentEmployee?.role === 'admin' || currentEmployee?.role === 'manager'

  if (!isSelf && !isAdmin) {
    return { error: "Anda tidak memiliki akses untuk mengubah pengaturan ini." }
  }

  // Generate target password: customPassword if provided & enabled, otherwise NIP (if enabled) or a secure random string (if disabled)
  const newPassword = enable 
    ? (customPassword || targetEmployee.nip) 
    : `rand_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`

  if (isSelf) {
    // Self-service: User updates their own password using their active cookie session client
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authError) {
      const isAlreadySame = authError.message.toLowerCase().includes('should be different') || 
                            authError.message.toLowerCase().includes('different from the old');
      if (!isAlreadySame) {
        return { error: `Gagal memperbarui kredensial akun: ${authError.message}` }
      }
    }
  } else {
    // Administrative reset for another employee's password (requires Service Role Key)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return { 
        error: "Konfigurasi keamanan admin belum lengkap. Harap hubungi Pengembang untuk menambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local untuk mengizinkan admin mengubah password pegawai lain. Pegawai tersebut tetap dapat mengaktifkan login password mereka sendiri melalui dashboard mereka." 
      }
    }

    // Instantiate Supabase client bypassing cookie wrapping
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (!targetEmployee.auth_id) {
      return { error: "Pegawai ini belum memiliki akun Auth terhubung. Pegawai harus login pertama kali menggunakan Google atau login NIP agar data tersinkronisasi." }
    }

    const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
      targetEmployee.auth_id,
      { password: newPassword }
    )

    if (adminError) {
      const isAlreadySame = adminError.message.toLowerCase().includes('should be different') || 
                            adminError.message.toLowerCase().includes('different from the old');
      if (!isAlreadySame) {
        return { error: `Gagal mengubah password via Admin API: ${adminError.message}` }
      }
    }
  }

  // 3. Update database setting status in employees table
  const { error: dbError } = await supabase
    .from('employees')
    .update({ is_password_enabled: enable })
    .eq('id', employeeId)

  if (dbError) {
    return { error: `Status berhasil diubah di Auth tetapi gagal menyimpan setelan di database: ${dbError.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin/employees')
  revalidatePath(`/admin/employees/${employeeId}`)
  return { success: true }
}
