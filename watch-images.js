#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정
const IMG_DIR = 'assets/img';
const QUALITY = 85;

// 이미지 최적화 함수
function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.png') {
            execSync(`pngquant --force --ext .png --quality=65-${QUALITY} "${filePath}"`, { stdio: 'ignore' });
        } else if (ext === '.jpg' || ext === '.jpeg') {
            execSync(`jpegoptim --max=${QUALITY} --strip-all "${filePath}"`, { stdio: 'ignore' });
        }
        return true;
    } catch (error) {
        return false;
    }
}

// 파일 감시 시작
function startWatching() {
    console.log('👀 이미지 파일 감시를 시작합니다...');
    console.log('📁 감시 디렉토리:', IMG_DIR);
    console.log('⚙️  품질 설정:', QUALITY + '%');
    console.log('🛑 종료하려면 Ctrl+C를 누르세요\n');
    
    fs.watch(IMG_DIR, { recursive: true }, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
            const filePath = path.join(IMG_DIR, filename);
            const ext = path.extname(filename).toLowerCase();
            
            // 이미지 파일인지 확인
            if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                // 파일이 실제로 존재하는지 확인 (파일 생성 이벤트)
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        console.log(`🖼️  새 이미지 발견: ${filename}`);
                        
                        if (optimizeImage(filePath)) {
                            console.log(`✅ 최적화 완료: ${filename}`);
                        } else {
                            console.log(`❌ 최적화 실패: ${filename}`);
                        }
                    }
                }, 1000); // 1초 대기 (파일 쓰기 완료 대기)
            }
        }
    });
}

startWatching();
