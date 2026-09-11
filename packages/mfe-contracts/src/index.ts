export type CommerceZone = "storefront" | "admin";

export type ZoneRoute = {
  zone: CommerceZone;
  pathPrefix: string;
  localUrl: string;
  productionUrl: string;
};

export type ZoneManifest = {
  shellName: string;
  zones: Record<CommerceZone, ZoneRoute>;
};

export const commerceZoneRoutes: Record<CommerceZone, Pick<ZoneRoute, "pathPrefix">> = {
  storefront: { pathPrefix: "/" },
  admin: { pathPrefix: "/admin" },
};
