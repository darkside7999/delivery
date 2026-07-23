import type { ComponentType } from 'react'

/**
 * Contrato de una feature. Cada fichero de src/app-surface/features/*.tsx
 * exporta por defecto un objeto con esta forma. El dashboard los descubre
 * automáticamente (import.meta.glob) y Vite recarga en caliente cuando Claude
 * añade, edita o borra uno. No hay registro manual que mantener.
 */
export interface Feature {
  id: string
  title: string
  size?: 'small' | 'medium' | 'large'
  Component: ComponentType
}

/** Tope de expansión: la página crece, pero no infinitamente. */
export const MAX_FEATURES = 12

const modules = import.meta.glob('../app-surface/features/*.tsx', { eager: true })

export const features: Feature[] = Object.values(modules)
  .map((mod) => (mod as { default?: Feature }).default)
  .filter(
    (f): f is Feature =>
      !!f && typeof f.id === 'string' && typeof f.title === 'string' && !!f.Component,
  )
  .sort((a, b) => a.id.localeCompare(b.id))
