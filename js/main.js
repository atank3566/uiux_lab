/**
 * 메인 실험 로직 파일
 * jsPsych 타임라인을 구성하고 실험을 실행합니다.
 */

// 실험 시작 전 소개 화면
const intro_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div class="intro-container">
      <h1>자율주행차 eHMI 시나리오 실험</h1>
      <div class="intro-content">
        <h2>실험 안내</h2>
        <p>이 실험에서는 <strong>보행자 관점</strong>에서 자율주행차의 eHMI(External Human-Machine Interface) 메시지를 보시고 평가해주시면 됩니다.</p>
        
        <h3>실험 절차</h3>
        <ol>
          <li>당신은 횡단보도 옆에 서 있는 보행자입니다.</li>
          <li>각 시나리오에서 자율주행차가 다가오며 표시하는 eHMI 메시지를 확인합니다.</li>
          <li>차량의 행동과 메시지를 본 후, 신뢰도에 대해 평가합니다.</li>
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
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    // 결과 데이터 가져오기
    const results = window.experimentResults;
    
    if (!results || !results.ratings || results.ratings.length === 0) {
      return `
        <div class="end-container">
          <h1>실험이 종료되었습니다</h1>
          <div class="end-content">
            <p>참여해주셔서 감사합니다!</p>
            <p>실험 데이터는 자동으로 저장되었습니다.</p>
            <button class="restart-button" onclick="location.reload()">다시 하기</button>
          </div>
        </div>
      `;
    }
    
    // 결과 테이블 생성
    let resultsTable = '<table class="results-table"><thead><tr><th>번호</th><th>시나리오</th><th>eHMI 메시지</th><th>신뢰도 점수</th><th>평가</th></tr></thead><tbody>';
    
    results.ratings.forEach((result, index) => {
      const colorClass = `eHMI-${result.eHMI_color}`;
      let ratingText = '';
      let ratingClass = '';
      
      // 점수에 따른 평가 텍스트
      if (result.rating === 5) {
        ratingText = '매우 신뢰 가능';
        ratingClass = 'rating-very-high';
      } else if (result.rating === 4) {
        ratingText = '신뢰 가능';
        ratingClass = 'rating-high';
      } else if (result.rating === 3) {
        ratingText = '보통';
        ratingClass = 'rating-medium';
      } else if (result.rating === 2) {
        ratingText = '신뢰 어려움';
        ratingClass = 'rating-low';
      } else {
        ratingText = '전혀 신뢰 불가';
        ratingClass = 'rating-very-low';
      }
      
      resultsTable += `
        <tr>
          <td class="scenario-number">${index + 1}</td>
          <td class="scenario-name">${result.scenario_title}</td>
          <td><span class="eHMI-badge ${colorClass}">${result.eHMI_message}</span></td>
          <td class="rating-score">${result.rating} / 5</td>
          <td class="rating-text ${ratingClass}">${ratingText}</td>
        </tr>
      `;
    });
    
    resultsTable += '</tbody></table>';
    
    // 평균 점수 표시
    const averageRating = parseFloat(results.averageRating);
    let averageText = '';
    if (averageRating >= 4) {
      averageText = '<p class="average-rating high">평균 신뢰도: <strong>' + averageRating + ' / 5</strong> (높음)</p>';
    } else if (averageRating >= 3) {
      averageText = '<p class="average-rating medium">평균 신뢰도: <strong>' + averageRating + ' / 5</strong> (보통)</p>';
    } else {
      averageText = '<p class="average-rating low">평균 신뢰도: <strong>' + averageRating + ' / 5</strong> (낮음)</p>';
    }
    
    return `
      <div class="end-container">
        <h1>실험이 종료되었습니다</h1>
        <div class="end-content">
          <p>참여해주셔서 감사합니다!</p>
          
          <div class="results-section">
            <h2>실험 결과</h2>
            ${averageText}
            ${resultsTable}
          </div>
          
          <div class="button-group">
            <button class="restart-button" onclick="location.reload()">다시 하기</button>
            <button class="download-button" onclick="downloadResults()">결과 다운로드</button>
          </div>
        </div>
      </div>
    `;
  },
  choices: "NO_KEYS",
  trial_duration: null, // 무제한 (버튼으로 종료)
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
// 플러그인이 로드되었는지 확인 후 실험 시작
if (typeof jsPsychHtmlKeyboardResponse === 'undefined') {
  console.error('플러그인이 로드되지 않았습니다!');
  document.getElementById('jspsych-experiment').innerHTML = 
    '<div style="padding: 50px; text-align: center;"><h1>오류 발생</h1><p>플러그인이 로드되지 않았습니다. 페이지를 새로고침해주세요.</p></div>';
} else {
  if (EXPERIMENT_CONFIG.DEBUG) {
    console.log('실험 타임라인:', timeline);
    console.log('시나리오 개수:', eHMI_SCENARIOS.length);
  }
  
  jsPsych.run(timeline);
}

// 결과 다운로드 함수
function downloadResults() {
  if (!window.experimentResults) {
    alert('다운로드할 결과가 없습니다.');
    return;
  }
  
  const dataStr = JSON.stringify(window.experimentResults.allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'experiment-results-' + Date.now() + '.json';
  link.click();
  URL.revokeObjectURL(url);
}

