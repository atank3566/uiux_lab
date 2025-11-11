/**
 * 3D 장면 렌더링 모듈
 * Three.js를 사용하여 3D 도로와 차량을 렌더링합니다.
 */

class Scene3D {
  constructor(containerId, animationType, scenarioId) {
    this.containerId = containerId;
    this.animationType = animationType;
    this.scenarioId = scenarioId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.vehicle = null;
    this.road = null;
    this.pedestrian = null;
    this.obstacle = null;
    this.emergencyVehicle = null;
    this.animationFrame = null;
    this.vehiclePosition = { x: 0, y: 0, z: -20 }; // 멀리서 다가옴
    this.vehicleSpeed = 0.15; // 기본 속도
    this.maxSpeed = 0.15; // 최대 속도
    this.isAnimating = false;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 장면 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // 밤하늘 색상
    this.scene.fog = new THREE.Fog(0x1a1a2e, 5, 30);

    // 카메라 설정 (보행자 시점: 횡단보도 옆에서 차량을 바라보는 시점)
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // 보행자 시점: 횡단보도 옆, 약간 높은 위치에서 차량을 바라봄
    this.camera.position.set(-3, 1.6, 6);
    // 횡단보도 앞쪽을 바라봄
    this.camera.lookAt(0, 0, 2);

    // 렌더러 설정
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 조명 추가
    this.setupLights();

    // 도로 생성
    this.createRoad();

    // 횡단보도 생성
    this.createCrosswalk();

    // 차량 생성
    this.createVehicle();

    // 시나리오별 객체 생성
    if (this.scenarioId === 'scenario_2') {
      this.createObstacle();
    } else if (this.scenarioId === 'scenario_3') {
      this.createEmergencyVehicle();
    }

    // 애니메이션 시작
    this.animate();
  }

  setupLights() {
    // 밤 장면을 위한 조명 설정
    // 환경광 (어둡게)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // 달빛 (차가운 푸른색)
    const moonLight = new THREE.DirectionalLight(0x8b9dc3, 0.5);
    moonLight.position.set(5, 10, 5);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 50;
    moonLight.shadow.camera.left = -10;
    moonLight.shadow.camera.right = 10;
    moonLight.shadow.camera.top = 10;
    moonLight.shadow.camera.bottom = -10;
    this.scene.add(moonLight);

    // 가로등 조명 (횡단보도 주변)
    const streetLight1 = new THREE.PointLight(0xffd700, 1, 15);
    streetLight1.position.set(-5, 4, 2);
    this.scene.add(streetLight1);

    const streetLight2 = new THREE.PointLight(0xffd700, 1, 15);
    streetLight2.position.set(5, 4, 2);
    this.scene.add(streetLight2);
  }

  createRoad() {
    // 도로 메쉬
    const roadGeometry = new THREE.PlaneGeometry(20, 100);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    this.road = new THREE.Mesh(roadGeometry, roadMaterial);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.y = 0;
    this.road.receiveShadow = true;
    this.scene.add(this.road);

    // 도로선
    const lineGeometry = new THREE.PlaneGeometry(0.2, 100);
    const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set((i - 1) * 3, 0.01, 0);
      this.scene.add(line);
    }

    // 풀밭
    const grassGeometry = new THREE.PlaneGeometry(30, 100);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.01, 0);
    this.scene.add(grass);
  }

  createCrosswalk() {
    // 횡단보도 생성 (90도 회전: 차량 진행 방향과 평행하게)
    // 차량은 z축 방향으로 이동하므로, 횡단보도 줄무늬도 z축 방향으로 길게
    const roadWidth = 6; // 도로 폭 (x축 방향)
    const stripeWidth = 0.1; // 각 흰 줄무늬의 폭 (x축 방향)
    const stripeSpacing = 0.5; // 줄무늬 간격 (x축 방향)
    const stripeCount = 16; // 흰 줄무늬 개수
    const crosswalkZ = 6; // 횡단보도 중심 위치 (카메라 앞, z축)
    const crosswalkLength = 2; // 횡단보도 길이 (z축 방향, 차량 진행 방향)
    
    // 횡단보도 흰 줄무늬들 (90도 회전된 형태)
    // 각 줄무늬는 z축 방향으로 길게 (차량 진행 방향과 평행)
    // x축 방향으로 여러 개 배치 (도로를 가로지름)
    for (let i = 0; i < stripeCount; i++) {
      const stripe = new THREE.Mesh(
        // PlaneGeometry(width, height)는 기본적으로 xy 평면
        // rotation.x = -PI/2 후: width는 x축, height는 z축
        // 따라서 PlaneGeometry(stripeWidth, crosswalkLength) = PlaneGeometry(0.1, 4)
        // → x축 방향 0.1, z축 방향 4
        new THREE.PlaneGeometry(stripeWidth, crosswalkLength),
        new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.3 // 약간의 발광 효과
        })
      );
      stripe.rotation.x = -Math.PI / 2; // 평면을 수평으로 회전
      
      // x축 방향으로 줄무늬들을 배치
      // 모든 줄무늬는 같은 z 위치(crosswalkZ)에, x축 방향으로만 배치
      const totalCrosswalkWidth = (stripeCount - 1) * (stripeWidth + stripeSpacing) + stripeWidth;
      const startX = -totalCrosswalkWidth / 2;
      const stripeX = startX + i * (stripeWidth + stripeSpacing) + stripeWidth / 2;
      
      stripe.position.set(stripeX, 0.02, crosswalkZ);
      this.scene.add(stripe);
    }
  }

  createVehicle() {
    const vehicleGroup = new THREE.Group();

    // 차체
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    vehicleGroup.add(body);

    // 차창
    const windowGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.95);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.7
    });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 0.8, 0);
    vehicleGroup.add(window);

    // 바퀴
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const positions = [
      { x: -0.7, y: 0.3, z: 0.6 },
      { x: 0.7, y: 0.3, z: 0.6 },
      { x: -0.7, y: 0.3, z: -0.6 },
      { x: 0.7, y: 0.3, z: -0.6 }
    ];

    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(this.vehiclePosition.x, this.vehiclePosition.y, this.vehiclePosition.z);
    this.vehicle = vehicleGroup;
    this.scene.add(vehicleGroup);

    // eHMI 디스플레이 생성 (차량 앞면에)
    this.createEHMI(vehicleGroup);
  }

  createEHMI(vehicleGroup) {
    // eHMI 메시지 표시판 (차량 앞면 상단)
    const eHMIGeometry = new THREE.PlaneGeometry(1.5, 0.4);
    let eHMIColor = 0x27ae60; // 기본 녹색
    
    if (this.scenarioId === 'scenario_1') {
      eHMIColor = 0x27ae60; // 녹색
    } else if (this.scenarioId === 'scenario_2') {
      eHMIColor = 0xf39c12; // 주황색
    } else if (this.scenarioId === 'scenario_3') {
      eHMIColor = 0xe74c3c; // 빨간색
    } else if (this.scenarioId === 'scenario_4') {
      eHMIColor = 0x3498db; // 파란색
    }

    const eHMIMaterial = new THREE.MeshStandardMaterial({ 
      color: eHMIColor,
      emissive: eHMIColor,
      emissiveIntensity: 0.5
    });
    const eHMI = new THREE.Mesh(eHMIGeometry, eHMIMaterial);
    eHMI.position.set(0, 1.2, 0.51);
    vehicleGroup.add(eHMI);
  }

  createObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xe67e22 });
    this.obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    this.obstacle.position.set(0, 0.5, -2); // 도로 중앙, 차량이 다가올 위치 (횡단보도 앞쪽)
    this.obstacle.castShadow = true;
    this.scene.add(this.obstacle);
  }

  createEmergencyVehicle() {
    const vehicleGroup = new THREE.Group();

    // 차체
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    vehicleGroup.add(body);

    // 바퀴
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const positions = [
      { x: -0.7, y: 0.3, z: 0.6 },
      { x: 0.7, y: 0.3, z: 0.6 },
      { x: -0.7, y: 0.3, z: -0.6 },
      { x: 0.7, y: 0.3, z: -0.6 }
    ];

    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(3, 0, -5); // 반대편에서 접근
    this.emergencyVehicle = vehicleGroup;
    this.scene.add(vehicleGroup);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    if (this.vehicle) {
      // 바퀴 회전
      this.vehicle.children.forEach(child => {
        if (child.type === 'Mesh' && child.geometry.type === 'CylinderGeometry') {
          child.rotation.x += 0.1;
        }
      });

      // 차량 이동 애니메이션
      if (this.isAnimating) {
        this.updateVehiclePosition();
      }
    }

    // 카메라가 차량을 따라가도록 (보행자 시점 유지하면서 차량을 바라봄)
    if (this.vehicle && this.isAnimating) {
      const targetZ = this.vehiclePosition.z;
      // 차량이 도로 끝까지 진행하는 동안 계속 바라봄
      if (targetZ < 30) {
        this.camera.lookAt(this.vehiclePosition.x, 0, targetZ);
      } else {
        // 차량이 도로 끝에 도달하면 마지막 위치를 바라봄
        this.camera.lookAt(this.vehiclePosition.x, 0, 30);
      }
    }

    // 응급차량 이동 (보행자 관점에서 보이도록)
    if (this.emergencyVehicle && this.animationType === 'yield') {
      if (this.emergencyVehicle.position.z < 0) {
        this.emergencyVehicle.position.z += 0.1;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateVehiclePosition() {
    // 횡단보도 앞 정지 위치 (횡단보도가 z=6, 길이=2이므로 앞쪽은 z=4)
    const stopBeforeCrosswalk = 4;
    
    if (this.animationType === 'stop') {
      // 정지 애니메이션: 차량이 다가오다가 횡단보도 앞에서 점진적으로 감속하며 정지
      if (this.vehiclePosition.z < stopBeforeCrosswalk) {
        // 횡단보도까지의 거리 계산
        const distanceToStop = stopBeforeCrosswalk - this.vehiclePosition.z;
        const decelerationStartDistance = 12; // 감속 시작 거리
        
        // 거리에 따라 속도 조절 (가까워질수록 느려짐)
        if (distanceToStop > decelerationStartDistance) {
          // 멀리 있을 때는 최대 속도
          this.vehicleSpeed = this.maxSpeed;
        } else {
          // 가까워질수록 속도 감소 (선형 감속)
          // 거리가 0에 가까워질수록 속도도 0에 가까워짐
          const decelerationFactor = distanceToStop / decelerationStartDistance;
          this.vehicleSpeed = this.maxSpeed * decelerationFactor;
          
          // 최소 속도 제한 (너무 느려지지 않도록)
          if (this.vehicleSpeed < 0.02) {
            this.vehicleSpeed = 0.02;
          }
        }
        
        this.vehiclePosition.z += this.vehicleSpeed;
        
        // 정지 위치에 도달했는지 확인 (매우 작은 거리 이내)
        if (distanceToStop <= 0.05) {
          this.vehiclePosition.z = stopBeforeCrosswalk;
          this.isAnimating = false;
        }
      } else {
        this.vehiclePosition.z = stopBeforeCrosswalk; // 횡단보도 앞에서 정지
        this.isAnimating = false;
      }
    } else if (this.animationType === 'evade') {
      // 회피 애니메이션: 차량이 다가오다가 장애물을 회피 후 횡단보도 근처에서 속도 낮추고 계속 진행
      if (this.vehiclePosition.z < -2) {
        // 장애물 전까지 진행
        this.vehiclePosition.z += this.vehicleSpeed;
      } else if (this.vehiclePosition.z < stopBeforeCrosswalk) {
        // 장애물 회피: 오른쪽으로 이동하며 횡단보도 앞으로 진행
        this.vehiclePosition.z += this.vehicleSpeed;
        this.vehiclePosition.x += 0.08;
      } else {
        // 횡단보도 근처에서 속도 낮추고 계속 진행
        const distanceToCrosswalk = this.vehiclePosition.z - stopBeforeCrosswalk;
        const slowDownDistance = 4; // 감속 구간
        const slowSpeedFactor = 0.5; // 감속된 속도 비율 (최대 속도의 50%)
        
        if (distanceToCrosswalk < slowDownDistance) {
          // 횡단보도 근처에서 속도 감소
          const speedFactor = slowSpeedFactor + (distanceToCrosswalk / slowDownDistance) * (1 - slowSpeedFactor); // 0.5 ~ 1.0
          this.vehicleSpeed = this.maxSpeed * speedFactor;
        } else {
          // 횡단보도 통과 후에도 낮춘 속도 유지
          this.vehicleSpeed = this.maxSpeed * slowSpeedFactor;
        }
        
        // 중앙으로 복귀
        if (this.vehiclePosition.x > 0) {
          this.vehiclePosition.x -= 0.03;
        }
        
        this.vehiclePosition.z += this.vehicleSpeed;
        
        // 끝까지 진행 (도로 끝까지)
        if (this.vehiclePosition.z > 30) {
          this.isAnimating = false;
        }
      }
    } else if (this.animationType === 'yield') {
      // 양보 애니메이션: 차량이 다가오다가 횡단보도 근처에서 속도 낮추고 계속 진행
      if (this.vehiclePosition.z < stopBeforeCrosswalk) {
        this.vehiclePosition.z += this.vehicleSpeed;
      } else {
        // 횡단보도 근처에서 속도 낮추고 계속 진행
        const distanceToCrosswalk = this.vehiclePosition.z - stopBeforeCrosswalk;
        const slowDownDistance = 4; // 감속 구간
        const slowSpeedFactor = 0.5; // 감속된 속도 비율 (최대 속도의 50%)
        
        if (distanceToCrosswalk < slowDownDistance) {
          // 횡단보도 근처에서 속도 감소
          const speedFactor = slowSpeedFactor + (distanceToCrosswalk / slowDownDistance) * (1 - slowSpeedFactor); // 0.5 ~ 1.0
          this.vehicleSpeed = this.maxSpeed * speedFactor;
        } else {
          // 횡단보도 통과 후에도 낮춘 속도 유지
          this.vehicleSpeed = this.maxSpeed * slowSpeedFactor;
        }
        
        // 옆으로 이동 (양보)
        this.vehiclePosition.x -= 0.05;
        if (this.vehiclePosition.x < -2) {
          this.vehiclePosition.x = -2;
        }
        
        this.vehiclePosition.z += this.vehicleSpeed;
        
        // 끝까지 진행 (도로 끝까지)
        if (this.vehiclePosition.z > 30) {
          this.isAnimating = false;
        }
      }
    } else if (this.animationType === 'proceed') {
      // 진행 애니메이션: 차량이 횡단보도 근처에서 속도 낮추고 계속 진행
      if (this.vehiclePosition.z < stopBeforeCrosswalk) {
        this.vehiclePosition.z += this.vehicleSpeed;
      } else {
        // 횡단보도 근처에서 속도 낮추고 계속 진행
        const distanceToCrosswalk = this.vehiclePosition.z - stopBeforeCrosswalk;
        const slowDownDistance = 4; // 감속 구간
        const slowSpeedFactor = 0.5; // 감속된 속도 비율 (최대 속도의 50%)
        
        if (distanceToCrosswalk < slowDownDistance) {
          // 횡단보도 근처에서 속도 감소
          const speedFactor = slowSpeedFactor + (distanceToCrosswalk / slowDownDistance) * (1 - slowSpeedFactor); // 0.5 ~ 1.0
          this.vehicleSpeed = this.maxSpeed * speedFactor;
        } else {
          // 횡단보도 통과 후에도 낮춘 속도 유지
          this.vehicleSpeed = this.maxSpeed * slowSpeedFactor;
        }
        
        this.vehiclePosition.z += this.vehicleSpeed;
        
        // 끝까지 진행 (도로 끝까지)
        if (this.vehiclePosition.z > 30) {
          this.isAnimating = false;
        }
      }
    }

    if (this.vehicle) {
      this.vehicle.position.set(
        this.vehiclePosition.x,
        this.vehiclePosition.y,
        this.vehiclePosition.z
      );
    }
  }

  startAnimation() {
    this.isAnimating = true;
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

