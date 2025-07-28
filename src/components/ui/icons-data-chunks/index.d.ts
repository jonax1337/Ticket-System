// Type declaration for index.json
declare module './index.json' {
  interface IndexData {
    categories: string[];
    hasUncategorized: boolean;
    totalIcons: number;
    categoryCounts: Record<string, number>;
  }
  const data: IndexData;
  export default data;
}

// Type declaration for category JSON files
declare module './*.json' {
  interface IconData {
    name: string;
    categories: string[];
    tags: string[];
  }
  const data: IconData[];
  export default data;
}