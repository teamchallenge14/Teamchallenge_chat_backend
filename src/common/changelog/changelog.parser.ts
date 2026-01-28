type ChangelogSection = {
  title: string;
  body: string;
};

export class ChangelogParser {
  static parseSections(markdown: string): ChangelogSection[] {
    const regex = /##\s*(\[[^\]]+\][^\n]*)\n([\s\S]*?)(?=\n##\s*\[|$)/g;

    const sections: ChangelogSection[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown))) {
      sections.push({
        title: match[1].trim(),
        body: match[2].trim(),
      });
    }

    return sections;
  }

  static toCollapsibleSections(markdown: string, maxSections = 5): string {
    const sections = this.parseSections(markdown).slice(0, maxSections);

    return (
      `## Changelog( last ${maxSections} records ) \n` +
      sections
        .map(
          ({ title, body }) => `
<details>
<summary><strong>${title}</strong></summary>

${body}

</details>
`,
        )
        .join('\n')
        .trim()
    );
  }
}
