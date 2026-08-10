interface LayoutWrapperProps {
  children: React.ReactNode
}

// Kept as the root-layout boundary while the dedicated admin layout owns the
// responsive administration shell.
export default function LayoutWrapper({children}: LayoutWrapperProps) {
  return children
}
