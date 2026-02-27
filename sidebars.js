// sidebars.js
// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'SOMAR App – Arquitectura de IA',
      items: [
        'somar-intro', // Página principal SOMAR (PDF de Arquitectura de IA)
        // Aquí luego podrás agregar más docs de SOMAR, por ejemplo:
        // 'somar-modulo-analitica',
        // 'somar-pronostico-demanda',
      ],
    },
    {
      type: 'category',
      label: 'Internal Financial Agents – Arquitectura Técnica',
      items: [
        'ifa-intro', // Página principal IFA (PDF de Internal Financial Agents)
        // Más docs de IFA en el futuro:
        // 'ifa-autenticacion',
        // 'ifa-reportes-ar',
      ],
    },
  ],
};

export default sidebars;