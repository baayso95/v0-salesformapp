import { cn } from "./utils"

type VariantConfig<T extends Record<string, Record<string, string>>> = {
  variants: T
  defaultVariants?: Partial<{
    [K in keyof T]: keyof T[K]
  }>
}

export function createVariants<T extends Record<string, Record<string, string>>>(
  base: string,
  config: VariantConfig<T>,
) {
  return (props?: Partial<{ [K in keyof T]: keyof T[K] }> & { className?: string }) => {
    const { className, ...variantProps } = props || {}

    let classes = base

    // Apply variant classes
    Object.entries(config.variants).forEach(([variantKey, variantValues]) => {
      const selectedVariant =
        variantProps[variantKey as keyof typeof variantProps] ||
        config.defaultVariants?.[variantKey as keyof typeof config.defaultVariants]

      if (selectedVariant && variantValues[selectedVariant as string]) {
        classes += " " + variantValues[selectedVariant as string]
      }
    })

    return cn(classes, className)
  }
}

export type VariantProps<T> = T extends (...args: any[]) => any ? Parameters<T>[0] : never
