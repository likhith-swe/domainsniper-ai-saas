/** Outbound registrar tracking-link builder with custom referral tags. */

const REF = "domainsniper";

const BUILDERS: Record<string, (domain: string) => string> = {
  GoDaddy: (d) =>
    `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(d)}&itc=parkweb&ref=${REF}`,
  Namecheap: (d) =>
    `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(d)}&ref=${REF}`,
  Dynadot: (d) =>
    `https://www.dynadot.com/domain/search?domain=${encodeURIComponent(d)}&ref=${REF}`,
  Porkbun: (d) =>
    `https://porkbun.com/checkout/search?q=${encodeURIComponent(d)}&ref=${REF}`,
};

export const REGISTRARS = ["GoDaddy", "Namecheap", "Dynadot", "Porkbun"] as const;

export function buildAffiliateUrl(domainName: string, registrar: string): string {
  const builder = BUILDERS[registrar] ?? BUILDERS.Dynadot;
  return builder(domainName);
}

export function registrarForDomain(registrar: string): string {
  return REGISTRARS.includes(registrar as (typeof REGISTRARS)[number])
    ? registrar
    : "Dynadot";
}
