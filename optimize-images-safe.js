#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 안전한 이미지 최적화 설정
const IMAGE_DIR = 'assets/img';
const QUALITY = 85;  // 품질 유지
const SKIP_FAVICONS = true;  // 파비콘 보호
const BACKUP_DIR = 'assets/img-backup';  // 백업 디렉토리

// 지원하는 이미지 확장자
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// 백업 생성
function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📦 백업 생성 중...');
    execSync(`cp -r ${IMAGE_DIR} ${BACKUP_DIR}`, { stdio: 'inherit' });
    console.log('✅ 백업 완료:', BACKUP_DIR);
  } else {
    console.log('📦 백업이 이미 존재합니다:', BACKUP_DIR);
  }
}

// 이미지 최적화 함수
function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const dir = path.dirname(filePath);
  const name = path.basename(filePath, ext);
  
  try {
    if (ext === '.png') {
      // PNG 최적화 (무손실)
      execSync(`pngquant --quality=65-85 --ext .png --force "${filePath}"`, { stdio: 'ignore' });
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG 최적화
      execSync(`jpegoptim --max=${QUALITY} --strip-all "${filePath}"`, { stdio: 'ignore' });
    }
    
    console.log(`✓ 최적화 완료: ${filePath}`);
  } catch (error) {
    console.log(`✗ 최적화 실패: ${filePath}`);
  }
}

// 디렉토리 재귀 탐색
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        // 파비콘 디렉토리는 건너뛰기
        if (SKIP_FAVICONS && filePath.includes('favicons')) {
          return;
        }
        
        // 원본 이미지 최적화
        optimizeImage(filePath);
      }
    }
  });
}

// 메인 실행
console.log('🖼️  안전한 이미지 최적화를 시작합니다...');
console.log('📁 대상 디렉토리:', IMAGE_DIR);
console.log('⚙️  품질 설정:', QUALITY + '%');
console.log('🛡️  파비콘 보호:', SKIP_FAVICONS ? '활성화' : '비활성화');
console.log('');

// 필요한 도구 설치 확인
try {
  execSync('which pngquant', { stdio: 'ignore' });
  execSync('which jpegoptim', { stdio: 'ignore' });
} catch (error) {
  console.log('❌ 필요한 이미지 최적화 도구가 설치되지 않았습니다.');
  console.log('다음 명령어로 설치하세요:');
  console.log('brew install pngquant jpegoptim');
  process.exit(1);
}

// 백업 생성
createBackup();

// 이미지 최적화 실행
if (fs.existsSync(IMAGE_DIR)) {
  console.log('🚀 이미지 최적화 시작...');
  scanDirectory(IMAGE_DIR);
  console.log('');
  console.log('✅ 이미지 최적화가 완료되었습니다!');
  console.log('📊 최적화 결과를 확인하려면 다음 명령어를 실행하세요:');
  console.log('du -sh assets/img');
} else {
  console.log('❌ 이미지 디렉토리를 찾을 수 없습니다:', IMAGE_DIR);
}
