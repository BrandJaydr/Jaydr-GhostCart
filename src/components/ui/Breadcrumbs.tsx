import { Breadcrumbs as HeroUIBreadcrumbs, BreadcrumbItem } from '@heroui/react';
import Link from 'next/link';

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface BreadcrumbsProps {
  items: Breadcrumb[];
  separator?: string;
}

export function Breadcrumbs({ items, separator = '/' }: BreadcrumbsProps) {
  return (
    <HeroUIBreadcrumbs separator={separator} className="mb-4">
      {items.map((item, index) => (
        <BreadcrumbItem 
          key={item.href}
          isLast={index === items.length - 1}
          href={index === items.length - 1 ? undefined : item.href}
          as={index === items.length - 1 ? 'span' : Link}
        >
          {item.label}
        </BreadcrumbItem>
      ))}
    </HeroUIBreadcrumbs>
  );
}
