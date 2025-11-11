/**
 * 메인 실험 로직 파일
 * jsPsych 타임라인을 구성하고 실험을 실행합니다.
 */

// 실험 시작 전 소개 화면
const intro_trial = {
  type: 'html-keyboard-response',
  stimulus: `
    <div class="intro-container">
      <h1>자율주행차 eHMI 시나리오 실험</h1>
      <div class="intro-content">
        <h2>실험 안내</h2>
        <p>이 실험에서는 자율주행차의 eHMI(External Human-Machine Interface) 메시지를 보시고 평가해주시면 됩니다.</p>
        
        <h3>실험 절차</h3>
        <ol>
          <li>각 시나리오에서 자율주행차의 eHMI 메시지를 확인합니다.</li>
          <li>메시지를 본 후, 신뢰도에 대해 평가합니다.</li>
          <li>총 ${eHMI_SCENARIOS.length}개의 시나리오가 제시됩니다.</li>
        </ol>
        
        <h3>조작 방법</h3>
        <ul>
          <li><strong>스페이스바</strong>: 다음 화면으로 진행</li>
          <li><strong>숫자 키 (1-5)</strong>: 평가 점수 선택</li>
        </ul>
        
        <p class="warning-text">실험 중에는 다른 작업을 하지 말아주세요.</p>
        <p class="start-text">준비되셨으면 <strong>스페이스바</strong>를 눌러 시작하세요.</p>
      </div>
    </div>
  `,
  choices: [' '],
  data: {
    trial_type: 'intro'
  }
};

// 실험 종료 화면
const end_trial = {
  type: 'html-keyboard-response',
  stimulus: `
    <div class="end-container">
      <h1>실험이 종료되었습니다</h1>
      <div class="end-content">
        <p>참여해주셔서 감사합니다!</p>
        <p>실험 데이터는 자동으로 저장되었습니다.</p>
        <p class="end-note">이 페이지를 닫으셔도 됩니다.</p>
      </div>
    </div>
  `,
  choices: "NO_KEYS",
  trial_duration: 3000,
  data: {
    trial_type: 'end'
  }
};

// 실험 타임라인 구성
const timeline = [
  intro_trial,
  ...createAllScenarioTrials(),
  end_trial
];

// 실험 시작
if (EXPERIMENT_CONFIG.DEBUG) {
  console.log('실험 타임라인:', timeline);
  console.log('시나리오 개수:', eHMI_SCENARIOS.length);
}

jsPsych.run(timeline);

