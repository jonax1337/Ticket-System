export enum IconCategory {
    Text = "text",
    Design = "design",
    Layout = "layout",
    Navigation = "navigation",
    Social = "social",
    Accessibility = "accessibility",
    Account = "account",
    Animals = "animals",
    Arrows = "arrows",
    Brands = "brands",
    Buildings = "buildings",
    Charts = "charts",
    Communication = "communication",
    Connectivity = "connectivity",
    Cursors = "cursors",
    Development = "development",
    Devices = "devices",
    Emoji = "emoji",
    Files = "files",
    Finance = "finance",
    FoodBeverage = "food-beverage",
    Gaming = "gaming",
    Home = "home",
    Mail = "mail",
    Math = "math",
    Medical = "medical",
    Multimedia = "multimedia",
    Nature = "nature",
    Notifications = "notifications",
    People = "people",
    Photography = "photography",
    Science = "science",
    Seasons = "seasons",
    Security = "security",
    Shapes = "shapes",
    Shopping = "shopping",
    Sports = "sports",
    Sustainability = "sustainability",
    Time = "time",
    Tools = "tools",
    Transportation = "transportation",
    Travel = "travel",
    Weather = "weather",
    Uncategorized = "uncategorized"
}

export interface IconData {
    name: string;
    categories: IconCategory[];
    tags: string[];
}

export interface IconsIndex {
    categories: IconCategory[];
    hasUncategorized: boolean;
    totalIcons: number;
    categoryCounts: Record<string, number>;
}

// Cache for loaded icon chunks
const iconChunksCache = new Map<string, IconData[]>();
let indexData: IconsIndex | null = null;

// Load the index data
export const loadIconsIndex = async (): Promise<IconsIndex> => {
    if (indexData) return indexData;
    
    try {
        const indexModule = await import('./icons-data-chunks/index.json');
        indexData = (indexModule as { default: IconsIndex }).default;
        return indexData as IconsIndex;
    } catch (error) {
        console.error('Failed to load icons index:', error);
        throw error;
    }
};

// Load icons for a specific category
export const loadIconsByCategory = async (category: string): Promise<IconData[]> => {
    if (iconChunksCache.has(category)) {
        return iconChunksCache.get(category)!;
    }
    
    try {
        const chunkModule = await import(`./icons-data-chunks/${category}.json`);
        const icons = (chunkModule as { default: IconData[] }).default;
        iconChunksCache.set(category, icons);
        return icons;
    } catch (error) {
        console.warn(`Failed to load icons for category: ${category}`, error);
        return [];
    }
};

// Load all icons (lazy)
export const loadAllIcons = async (): Promise<IconData[]> => {
    const index = await loadIconsIndex();
    const allCategories: string[] = [...index.categories];
    if (index.hasUncategorized) {
        allCategories.push('uncategorized');
    }
    
    const iconChunks = await Promise.all(
        allCategories.map(category => loadIconsByCategory(category))
    );
    
    // Flatten and deduplicate icons (since some icons appear in multiple categories)
    const allIcons = new Map<string, IconData>();
    iconChunks.forEach(chunk => {
        chunk.forEach(icon => {
            allIcons.set(icon.name, icon);
        });
    });
    
    return Array.from(allIcons.values());
};

// Load icons for multiple categories
export const loadIconsByCategories = async (categories: IconCategory[]): Promise<IconData[]> => {
    const iconChunks = await Promise.all(
        categories.map(category => loadIconsByCategory(category))
    );
    
    // Flatten and deduplicate
    const icons = new Map<string, IconData>();
    iconChunks.forEach(chunk => {
        chunk.forEach(icon => {
            icons.set(icon.name, icon);
        });
    });
    
    return Array.from(icons.values());
};

// Helper function to get all available categories
export const getAvailableCategories = async (): Promise<string[]> => {
    const index = await loadIconsIndex();
    return index.categories;
};

// Legacy export for backward compatibility - now loads dynamically
let _iconsDataCache: IconData[] | null = null;

export const iconsData: IconData[] = new Proxy([], {
    get(target, prop) {
        if (prop === 'length' && _iconsDataCache) {
            return _iconsDataCache.length;
        }
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
            if (!_iconsDataCache) {
                console.warn('Icons data not loaded yet. Use loadAllIcons() for better control.');
                return undefined;
            }
            return _iconsDataCache[parseInt(prop)];
        }
        if (prop === Symbol.iterator && _iconsDataCache) {
            return _iconsDataCache[Symbol.iterator].bind(_iconsDataCache);
        }
        if (typeof prop === 'string' && _iconsDataCache && prop in _iconsDataCache) {
            return (_iconsDataCache as IconData[])[prop as keyof IconData[]];
        }
        return (target as IconData[])[prop as keyof IconData[]];
    }
});

// Initialize cache on first access (only in browser)
if (typeof window !== 'undefined') {
    loadAllIcons().then(icons => {
        _iconsDataCache = icons;
    }).catch(error => {
        console.error('Failed to load icons data:', error);
    });
}