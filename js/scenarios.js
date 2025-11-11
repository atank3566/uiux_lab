/**
 * eHMI 시나리오 정의 파일
 * 다양한 자율주행차 eHMI 상황을 시나리오로 정의합니다.
 */

// eHMI 시나리오 데이터 (보행자 관점)
const eHMI_SCENARIOS = [
  {
    id: 'scenario_1',
    title: '보행자 감지 시나리오',
    description: '횡단보도에서 자율주행차가 당신을 감지하고 정지합니다.',
    eHMI_message: 'PEDESTRIAN DETECTED - STOPPING',
    eHMI_color: 'green',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Zebra_crossing.jpg/640px-Zebra_crossing.jpg',
    context: '당신은 횡단보도 앞에 서 있습니다. 자율주행차가 다가오며 eHMI 메시지를 표시하고 정지합니다.'
  },
  {
    id: 'scenario_2',
    title: '비상 상황 시나리오',
    description: '횡단보도에서 자율주행차가 장애물을 회피하는 모습을 관찰합니다.',
    eHMI_message: 'OBSTACLE DETECTED - EVADING',
    eHMI_color: 'orange',
    image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=640',
    context: '당신은 횡단보도 옆에 서 있습니다. 자율주행차가 도로의 장애물을 감지하고 회피하는 모습을 봅니다.'
  },
  {
    id: 'scenario_3',
    title: '우선순위 양보 시나리오',
    description: '횡단보도에서 자율주행차가 응급차량을 위해 양보하는 모습을 관찰합니다.',
    eHMI_message: 'EMERGENCY VEHICLE - YIELDING',
    eHMI_color: 'red',
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=640',
    context: '당신은 횡단보도 옆에 서 있습니다. 자율주행차가 응급차량을 감지하고 자동으로 양보하는 모습을 봅니다.'
  },
  {
    id: 'scenario_4',
    title: '안전 통과 시나리오',
    description: '횡단보도에서 자율주행차가 안전하게 진행하는 모습을 관찰합니다.',
    eHMI_message: 'CLEAR PATH - PROCEEDING',
    eHMI_color: 'blue',
    image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=640',
    context: '당신은 횡단보도 옆에 서 있습니다. 자율주행차가 도로가 맑음을 표시하며 안전하게 진행합니다.'
  }
];

/**
 * 시나리오를 jsPsych 트라이얼로 변환하는 함수
 * @param {Object} scenario - 시나리오 객체
 * @returns {Object} jsPsych 트라이얼 객체
 */
function createScenarioTrial(scenario) {
  // 시나리오별 애니메이션 타입 결정
  let animationType = 'move';
  if (scenario.id === 'scenario_1') {
    animationType = 'stop'; // 보행자 감지 - 정지
  } else if (scenario.id === 'scenario_2') {
    animationType = 'evade'; // 장애물 회피
  } else if (scenario.id === 'scenario_3') {
    animationType = 'yield'; // 양보
  } else if (scenario.id === 'scenario_4') {
    animationType = 'proceed'; // 진행
  }

  // 고유한 컨테이너 ID 생성
  const containerId = 'scene3d-' + scenario.id + '-' + Date.now();

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="scenario-container">
        <h2 class="scenario-title">${scenario.title}</h2>
        <div class="scenario-content">
          <div id="${containerId}" class="scene3d-container"></div>
          <div class="eHMI-message eHMI-${scenario.eHMI_color}">
            <p class="eHMI-text">${scenario.eHMI_message}</p>
          </div>
          <p class="scenario-context">${scenario.context}</p>
        </div>
      </div>
    `,
    choices: [' '],
    trial_duration: EXPERIMENT_CONFIG.SCENARIO_DURATION,
    prompt: '<p class="prompt-text">잠시 후 평가 문항이 나타납니다...</p>',
    on_load: function() {
      // 3D 장면 초기화 및 애니메이션 시작
      setTimeout(function() {
        const scene3d = new Scene3D(containerId, animationType, scenario.id);
        scene3d.init();
        scene3d.startAnimation();
        
        // 트라이얼 종료 시 정리
        window.currentScene3d = scene3d;
      }, 100);
    },
    on_finish: function() {
      // 3D 장면 정리
      if (window.currentScene3d) {
        window.currentScene3d.dispose();
        window.currentScene3d = null;
      }
    },
    data: {
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      eHMI_message: scenario.eHMI_message,
      eHMI_color: scenario.eHMI_color,
      animation_type: animationType
    }
  };
}

/**
 * 평가 트라이얼을 생성하는 함수
 * @param {Object} scenario - 시나리오 객체
 * @returns {Object} jsPsych 트라이얼 객체
 */
function createRatingTrial(scenario) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="rating-container">
        <h3>평가 문항</h3>
        <p class="rating-question">다음 질문에 대해 1(전혀 아님)부터 5(매우 그렇다)까지 선택해주세요.</p>
        <div class="rating-options">
          <p><strong>이 자율주행차의 eHMI 메시지를 보고 얼마나 신뢰할 수 있다고 느꼈나요?</strong></p>
          <p class="rating-scale">1 (전혀 신뢰 불가) → 5 (매우 신뢰 가능)</p>
          <p class="rating-instruction"><span class="key-number">[1]</span><span class="key-number">[2]</span><span class="key-number">[3]</span><span class="key-number">[4]</span><span class="key-number">[5]</span> 키 중 하나를 눌러 선택하세요.</p>
        </div>
      </div>
    `,
    choices: ['1', '2', '3', '4', '5'],
    data: {
      trial_type: 'trust_rating',
      scenario_id: scenario.id,
      question: 'trust_rating'
    },
    on_finish: function(data) {
      data.rating_value = parseInt(data.response);
      data.scenario_id = scenario.id;
    }
  };
}

/**
 * 모든 시나리오를 트라이얼 배열로 변환
 * @returns {Array} jsPsych 트라이얼 배열
 */
function createAllScenarioTrials() {
  const trials = [];
  
  eHMI_SCENARIOS.forEach(scenario => {
    // 시나리오 표시
    trials.push(createScenarioTrial(scenario));
    
    // 평가 문항
    trials.push(createRatingTrial(scenario));
  });
  
  return trials;
}

