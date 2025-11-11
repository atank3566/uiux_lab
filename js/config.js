/**
 * jsPsych 실험 설정 파일
 * eHMI 시나리오 실험의 전역 설정을 관리합니다.
 */

// 실험 결과를 저장할 전역 변수
window.experimentResults = null;

// jsPsych 초기화 설정
const jsPsych = initJsPsych({
  display_element: 'jspsych-experiment',
  on_finish: function() {
    // 실험 데이터 수집
    const data = jsPsych.data.get().json();
    console.log('실험 데이터:', data);
    
    // 평가 결과 추출
    const ratings = data.filter(trial => trial.trial_type === 'trust_rating');
    const results = ratings.map(rating => ({
      scenario_id: rating.scenario_id,
      scenario_title: rating.scenario_title || eHMI_SCENARIOS.find(s => s.id === rating.scenario_id)?.title || '알 수 없음',
      rating: rating.rating_value,
      eHMI_message: rating.eHMI_message,
      eHMI_color: rating.eHMI_color
    }));
    
    // 전역 변수에 저장
    window.experimentResults = {
      allData: data,
      ratings: results,
      averageRating: results.length > 0 ? (results.reduce((sum, r) => sum + r.rating, 0) / results.length).toFixed(2) : 0
    };
    
    // 필요시 여기서 데이터를 서버로 전송할 수 있습니다
    // saveDataToServer(data);
  },
  on_trial_finish: function(data) {
    // 각 트라이얼 종료 시 타임스탬프 추가
    data.timestamp = Date.now();
  },
  show_progress_bar: true, // 진행 바 표시
  message_progress_bar: '진행률'
});

// 실험 설정 상수
const EXPERIMENT_CONFIG = {
  // 시나리오 표시 시간 (밀리초)
  SCENARIO_DURATION: 5000,
  
  // 평가 시간 제한 (밀리초, null이면 제한 없음)
  RATING_TIMEOUT: null,
  
  // 실험 모드 ('practice' 또는 'main')
  MODE: 'main',
  
  // 디버그 모드
  DEBUG: false
};

// 실험 데이터 저장 함수 (선택사항)
function saveDataToServer(data) {
  // 실제 구현 시 서버 엔드포인트로 데이터 전송
  // fetch('/api/save-experiment', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
}

