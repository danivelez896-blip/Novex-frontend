import PortalSession from "./PortalSession";

export const metadata = { referrer: "no-referrer" };

export default function ReturnLayout({ children }: { children: React.ReactNode }) {
  return <PortalSession>{children}</PortalSession>;
}
