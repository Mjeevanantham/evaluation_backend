import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { TemplateDelegate, compile } from 'handlebars';

export class TemplateLoader {
  private templates: { [name: string]: TemplateDelegate } = {};

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates() {
    const templatesDir = join(__dirname, '..', 'utils', 'templates');
    const files = readdirSync(templatesDir);

    files.forEach((file) => {
      const filePath = join(templatesDir, file);
      const templateName = file.replace('.hbs', '');
      const source = readFileSync(filePath, 'utf8');
      this.templates[templateName] = compile(source);
    });
  }

  public getTemplate(name: string): TemplateDelegate {
    const template = this.templates[name];
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    return template;
  }
}
