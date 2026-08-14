import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminGraphCharacter {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
  isCenter: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminGraphRelation {
  id: string
  fromCharacterId: string
  toCharacterId: string
  relationLabel: string
  sortOrder: number
  createdAt?: string
}

export interface CharacterPayload {
  name: string
  avatarUrl?: string
  bio?: string
  isCenter?: boolean
  sortOrder?: number
}

export interface RelationPayload {
  fromCharacterId: string
  toCharacterId: string
  relationLabel: string
  sortOrder?: number
}

export const getAdminCharacters = (page = 1, pageSize = 20) =>
  request<Paginated<AdminGraphCharacter>>({
    url: '/api/admin/graph/characters',
    method: 'GET',
    params: { page, pageSize },
  })

export const getAllCharacters = async () => {
  const data = await getAdminCharacters(1, 100)
  return data.list
}

export const createCharacter = (data: CharacterPayload) =>
  request<{ id: string }>({ url: '/api/admin/graph/characters', method: 'POST', data })

export const updateCharacter = (id: string, data: Partial<CharacterPayload>) =>
  request<null>({ url: `/api/admin/graph/characters/${id}`, method: 'PUT', data })

export const deleteCharacter = (id: string) =>
  request<null>({ url: `/api/admin/graph/characters/${id}`, method: 'DELETE' })

export const getAdminRelations = (page = 1, pageSize = 20) =>
  request<Paginated<AdminGraphRelation>>({
    url: '/api/admin/graph/relations',
    method: 'GET',
    params: { page, pageSize },
  })

export const createRelation = (data: RelationPayload) =>
  request<{ id: string }>({ url: '/api/admin/graph/relations', method: 'POST', data })

export const updateRelation = (id: string, data: Partial<RelationPayload>) =>
  request<null>({ url: `/api/admin/graph/relations/${id}`, method: 'PUT', data })

export const deleteRelation = (id: string) =>
  request<null>({ url: `/api/admin/graph/relations/${id}`, method: 'DELETE' })
