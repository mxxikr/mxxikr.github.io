#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정
const IMG_DIR = 'assets/img';
const QUALITY = 85;
const SKIP_FAVICONS = true;

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

// 새로 추가된 이미지 파일 찾기
function getNewImages() {
    try {
        // Git에서 새로 추가된 파일들 가져오기
        const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        const addedFiles = execSync('git diff --cached --name-status', { encoding: 'utf8' });
        
        const newImages = [];
        const lines = addedFiles.split('\n');
        
        lines.forEach(line => {
            if (line.startsWith('A\t') && line.includes(IMG_DIR)) {
                const filePath = line.substring(2);
                const ext = path.extname(filePath).toLowerCase();
                if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                    // 파비콘 제외
                    if (!SKIP_FAVICONS || !filePath.includes('favicon')) {
                        newImages.push(filePath);
                    }
                }
            }
        });
        
        return newImages;
    } catch (error) {
        return [];
    }
}

// 메인 실행
function main() {
    console.log('🖼️  자동 이미지 최적화 시작...');
    
    const newImages = getNewImages();
    
    if (newImages.length === 0) {
        console.log('📝 최적화할 새 이미지가 없습니다.');
        return;
    }
    
    console.log(`📦 ${newImages.length}개의 새 이미지를 발견했습니다.`);
    
    let optimized = 0;
    let failed = 0;
    
    newImages.forEach(imagePath => {
        console.log(`⚙️  최적화 중: ${imagePath}`);
        
        if (optimizeImage(imagePath)) {
            optimized++;
            console.log(`✅ 완료: ${imagePath}`);
        } else {
            failed++;
            console.log(`❌ 실패: ${imagePath}`);
        }
    });
    
    console.log(`\n📊 최적화 완료: ${optimized}개 성공, ${failed}개 실패`);
    
    if (optimized > 0) {
        console.log('🔄 최적화된 파일들을 Git에 다시 추가합니다...');
        try {
            execSync(`git add ${newImages.join(' ')}`, { stdio: 'ignore' });
            console.log('✅ Git에 추가 완료!');
        } catch (error) {
            console.log('⚠️  Git 추가 실패:', error.message);
        }
    }
}

main();
