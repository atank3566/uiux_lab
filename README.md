# eHMI 시나리오 실험

jsPsych을 활용한 자율주행차 eHMI(External Human-Machine Interface) 시나리오 실험 프로젝트입니다.

## 프로젝트 구조

```
lab/
├── index.html          # 메인 HTML 파일
├── js/
│   ├── config.js       # 실험 설정 및 초기화
│   ├── scenarios.js    # eHMI 시나리오 정의
│   └── main.js         # 메인 실험 로직
├── css/
│   └── style.css       # 스타일시트
└── README.md           # 프로젝트 설명
```

## 파일 설명

### index.html
- jsPsych 라이브러리 및 플러그인 로드
- 커스텀 스타일시트 연결
- JavaScript 파일들 로드

### js/config.js
- jsPsych 초기화 설정
- 실험 전역 설정 상수 (EXPERIMENT_CONFIG)
- 데이터 저장 함수

### js/scenarios.js
- eHMI 시나리오 데이터 정의 (eHMI_SCENARIOS)
- 시나리오를 jsPsych 트라이얼로 변환하는 함수들
- 시나리오별 평가 트라이얼 생성 함수

### js/main.js
- 실험 타임라인 구성
- 소개 화면, 시나리오, 평가, 종료 화면 정의
- 실험 실행

### css/style.css
- 전체 실험 UI 스타일링
- 반응형 디자인 지원

## 사용 방법

1. 웹 서버를 통해 실행 (로컬 서버 권장)
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server
   ```

2. 브라우저에서 `http://localhost:8000` 접속

3. 실험 진행:
   - 스페이스바로 다음 화면 진행
   - 숫자 키 (1-5)로 평가 점수 선택

## 시나리오 커스터마이징

`js/scenarios.js` 파일의 `eHMI_SCENARIOS` 배열을 수정하여 시나리오를 추가하거나 변경할 수 있습니다.

각 시나리오는 다음 속성을 가집니다:
- `id`: 시나리오 고유 ID
- `title`: 시나리오 제목
- `description`: 시나리오 설명
- `eHMI_message`: eHMI 메시지 텍스트
- `eHMI_color`: 메시지 색상 (green, orange, red, blue)
- `image_url`: 시나리오 이미지 URL
- `context`: 시나리오 상황 설명

## 실험 설정 변경

`js/config.js` 파일의 `EXPERIMENT_CONFIG` 객체를 수정하여 실험 설정을 변경할 수 있습니다:
- `SCENARIO_DURATION`: 시나리오 표시 시간 (밀리초)
- `RATING_TIMEOUT`: 평가 시간 제한
- `MODE`: 실험 모드
- `DEBUG`: 디버그 모드

## 데이터 수집

실험 데이터는 브라우저 콘솔에 자동으로 출력됩니다. 
서버로 데이터를 전송하려면 `js/config.js`의 `saveDataToServer()` 함수를 구현하세요.

## 라이선스

이 프로젝트는 교육 및 연구 목적으로 자유롭게 사용할 수 있습니다.
