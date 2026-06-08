import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const CUTI_DETAIL_SELECT = `
  *,
  employee:employees!employee_id (
    id, name, nip, unit, position, phone_number, start_date
  ),
  atasan:employees!atasan_id (
    id, name, nip, position, unit
  ),
  pejabat:employees!pejabat_id (
    id, name, nip, position, unit
  )
`

