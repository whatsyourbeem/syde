// linkifyjs' default check only asks for a dotted hostname, so bare words that happen to end in a
// real ccTLD ("README.md", "main.py", "deploy.sh", "lib.rs") get auto-linked to an unrelated site.
// Only autolink when the writer's intent is unambiguous: an explicit protocol or a "www." prefix.
export function shouldAutoLink(url: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(url) || /^www\./i.test(url);
}
