export type SkippedRow = {
  sheet?: string;
  row: number;
  reason: string;
  raw?: Record<string, unknown>;
};

export type ParsedComment = {
  bodyHtml: string;
  sourceKey?: string;
};

export type ParsedItem = {
  name: string;
  sourceKey?: string;
  comments: ParsedComment[];
};

export type ParsedSection = {
  name: string;
  sourceKey?: string;
  items: ParsedItem[];
};

export type ParsePreview = {
  templateName: string;
  sections: ParsedSection[];
  preserved: {
    sectionCount: number;
    itemCount: number;
    commentCount: number;
  };
  skipped: SkippedRow[];
  warnings: string[];
};

export type TemplateSummary = {
  id: string;
  name: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  parentTemplateId: string | null;
  sectionCount: number;
  itemCount: number;
  commentCount: number;
};

export type TemplateDetail = {
  id: string;
  name: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  parentTemplateId: string | null;
  sections: Array<{
    id: string;
    name: string;
    position: number;
    sourceKey: string | null;
    items: Array<{
      id: string;
      name: string;
      position: number;
      sourceKey: string | null;
      comments: Array<{
        id: string;
        bodyHtml: string;
        position: number;
        sourceKey: string | null;
      }>;
    }>;
  }>;
};
