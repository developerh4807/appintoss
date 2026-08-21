// [NEW 2026-08-21] 토스 빌드는 햅틱을 쓰지 않는다(4️⃣ — 햅틱은 Android 범위).
// 인터페이스만 맞춘 no-op이라 호출부가 플랫폼을 몰라도 된다.
export function vibrate(_pattern: number | number[]): void {
  void _pattern;
}
