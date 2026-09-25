export function courseKey(course: string) {
  return course
    .split(':')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}