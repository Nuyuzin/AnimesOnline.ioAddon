const manifest = {
    id: "org.animesonline.io",
    version: "1.0.0",
    name: "Animes Online Addon",
    description: "Assista animes diretamente do animesonline.io no Stremio.",
    resources: ["catalog", "meta", "stream"],
    types: ["anime", "series", "movie"],
    idPrefixes: ["ao:"],
    catalogs: [
        {
            type: "anime",
            id: "ao_popular",
            name: "Animes Online - Populares",
            extra: [{ name: "search", isRequired: false }]
        },
        {
            type: "anime",
            id: "ao_recent",
            name: "Animes Online - Recentes",
            extra: [{ name: "search", isRequired: false }]
        },
        {
            type: "anime",
            id: "ao_dubbed",
            name: "Animes Online - Dublados",
            extra: [{ name: "search", isRequired: false }]
        }
    ]
};

module.exports = manifest;
