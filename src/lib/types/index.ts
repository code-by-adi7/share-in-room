export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  password_hash: string
  author_id: string
  upload_enabled: boolean
  total_visitor_count: number
  created_at: string
  is_deleted: boolean
  deleted_at: string | null
}

export interface Membership {
  id: string
  account_id: string
  room_id: string
  alias_number: number
  upload_permission: boolean
  individually_restricted: boolean
  first_entry_at: string
}

export interface ActiveRoomSession {
  id: string
  account_id: string
  room_id: string
  last_heartbeat: string
  joined_at: string
}

export interface FileRecord {
  id: string
  room_id: string
  uploader_id: string | null
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_at: string
  is_deleted: boolean
  deleted_at: string | null
}

export interface HistoryEntry {
  id: string
  account_id: string
  room_id: string
  last_entry_at: string
  encrypted_room_password: string
}