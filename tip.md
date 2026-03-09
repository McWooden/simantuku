> [!TIP]
> **How to set yourself as an Admin:**
> To test these pages, go to your **Supabase Dashboard** -> **SQL Editor** and run:
> ```sql
> UPDATE profiles SET role = 'admin' WHERE username = 'YourUsername';
> ```
> (Or use the Table Editor to change your role column to `admin`).