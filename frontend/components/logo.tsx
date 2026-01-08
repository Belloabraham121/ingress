import Image from "next/image";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Image
      src="/logo-new.png"
      alt="Ingress"
      width={200}
      height={60}
      className={className}
      priority
    />
  );
};
