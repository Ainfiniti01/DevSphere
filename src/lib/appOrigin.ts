const documentedProductionOrigin = 'https://dev-sphere-kappa.vercel.app';

export const getApplicationOrigin = () => {
  if (typeof window === 'undefined') return documentedProductionOrigin;

  const configuredOrigin = import.meta.env.VITE_APP_ORIGIN?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');

  const isLocalDevelopment = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  return isLocalDevelopment ? documentedProductionOrigin : window.location.origin;
};

export const getProjectUrl = (projectId: string) =>
  `${getApplicationOrigin()}/project/${encodeURIComponent(projectId)}`;
