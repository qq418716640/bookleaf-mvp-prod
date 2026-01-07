export function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export function toCurlyQuotes(s: string): string {
  // Very lightweight: wrap with curly quotes if not already wrapped.
  // Assumes Latin-script primary.
  const t = s.trim()
  const hasWrapping =
    (t.startsWith('“') && t.endsWith('”')) ||
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith('”') && t.endsWith('“'))

  if (hasWrapping) {
    return t
      .replace(/^"/, '“')
      .replace(/"$/, '”')
  }
  return `“${t.replace(/"/g, '”')}”`
}

export function formatAuthor(author: string): string {
  const t = normalizeSpaces(author)
  if (!t) return ''
  // em dash (U+2014)
  return `— ${t}`
}

export function isLatinText(text: string): boolean {
  const stripped = text.replace(/\s/g, '')
  if (!stripped) return true
  const latin = (stripped.match(/[A-Za-z]/g) ?? []).length
  const total = stripped.length
  return total > 0 && latin / total > 0.6
}
