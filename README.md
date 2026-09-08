# 코트큐

React Native + Expo + TypeScript 기반의 온라인 방 관리 앱입니다. 호스트가 방을 만들면 참가자는 QR 코드 또는 방 코드/비밀번호로 들어와 대기열을 추가하고 수정할 수 있습니다.

## Supabase 준비

Supabase Dashboard에서 프로젝트를 열고 `SQL Editor`에 [supabase/schema.sql](./supabase/schema.sql) 내용을 그대로 실행해야 합니다.

앱은 Supabase `rooms` 테이블에 방 상태를 JSON으로 저장하고 Realtime으로 동기화합니다. 현재 클라이언트 권한 제한은 앱 UI 기준입니다.

## 실행

Expo SDK 54 기준으로 Node.js 20.19.4 이상이 필요합니다.

```bash
npm install
npx expo start
```

Expo Go 앱에서 QR 코드를 스캔해 Android 기기나 태블릿에서 테스트할 수 있습니다.

## Android 빌드 준비

```bash
npx eas-cli login
eas build:configure
eas build -p android --profile preview
```

실제 APK/AAB 빌드는 Expo 계정, EAS 프로젝트 설정, 빌드 프로필 구성이 필요합니다.
현재 `eas.json`에는 테스트 설치용 `preview` APK와 스토어 제출용 `production` AAB 프로필을 넣어 두었습니다.

## Google Play Store용 AAB 빌드

Play Store 업로드용 파일은 APK가 아니라 AAB입니다.

```bash
npx eas-cli login
npm run build:android:production
```

처음 빌드할 때 EAS가 Android signing key를 생성하거나 기존 키를 사용할지 묻습니다. 새 앱이면 EAS가 생성하도록 선택하면 됩니다.

## 나중에 붙이기 좋은 기능

- AsyncStorage 또는 SQLite를 이용한 로컬 저장
- Supabase 연동을 통한 여러 기기 동기화
- 선수별 경기 횟수와 휴식 시간 통계
- 코트별 게임 타이머
