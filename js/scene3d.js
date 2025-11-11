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
    this.vehiclePosition = { x: 0, y: 0, z: -15 }; // 멀리서 다가옴
    this.vehicleSpeed = 0.15;
    this.isAnimating = false;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // 장면 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // 하늘색
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // 카메라 설정 (보행자 시점: 횡단보도 옆에서 차량을 바라보는 시점)
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // 보행자 시점: 횡단보도 옆, 약간 높은 위치에서 차량을 바라봄
    this.camera.position.set(-3, 1.6, 8);
    this.camera.lookAt(0, 0, 0);

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
    // 환경광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 방향광
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
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
    // 횡단보도 생성 (도로 중앙)
    const crosswalkGeometry = new THREE.PlaneGeometry(4, 0.5);
    const crosswalkMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // 횡단보도 줄무늬
    for (let i = 0; i < 8; i++) {
      const stripe = new THREE.Mesh(crosswalkGeometry, crosswalkMaterial);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.02, -2 + i * 0.6);
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
    this.obstacle.position.set(0, 0.5, -3); // 도로 중앙, 차량이 다가올 위치
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
      this.camera.lookAt(this.vehiclePosition.x, 0, targetZ);
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
    if (this.animationType === 'stop') {
      // 정지 애니메이션: 차량이 다가오다가 횡단보도 앞에서 정지
      if (this.vehiclePosition.z < -2) {
        this.vehiclePosition.z += this.vehicleSpeed;
      } else {
        this.vehiclePosition.z = -2;
        this.isAnimating = false;
      }
    } else if (this.animationType === 'evade') {
      // 회피 애니메이션: 차량이 다가오다가 장애물을 회피
      if (this.vehiclePosition.z < -3) {
        this.vehiclePosition.z += this.vehicleSpeed;
      } else if (this.vehiclePosition.z < -1) {
        this.vehiclePosition.z += this.vehicleSpeed;
        this.vehiclePosition.x += 0.05;
      } else {
        this.vehiclePosition.z += this.vehicleSpeed;
        this.vehiclePosition.x -= 0.05;
      }
    } else if (this.animationType === 'yield') {
      // 양보 애니메이션: 차량이 다가오다가 멈추고 옆으로 이동
      if (this.vehiclePosition.z < -2) {
        this.vehiclePosition.z += this.vehicleSpeed;
      } else if (this.vehiclePosition.z < -1.5) {
        this.vehiclePosition.z = -2;
        this.vehiclePosition.x -= 0.05;
        if (this.vehiclePosition.x < -2) {
          this.vehiclePosition.x = -2;
          this.isAnimating = false;
        }
      }
    } else if (this.animationType === 'proceed') {
      // 진행 애니메이션: 차량이 계속 진행
      this.vehiclePosition.z += this.vehicleSpeed;
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

