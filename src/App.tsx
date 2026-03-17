import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Joystick } from './components/Joystick';
import { GameOver } from './components/GameOver';
import { Player, Enemy, Projectile, XPGem, WeaponType, PassiveType, Skill, GroundSpike, GameItem, Vector2D, Character, Level, LaserTrap, Platform } from './types';
import { SKILLS, CHARACTERS, LEVELS, ACHIEVEMENTS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { audioService } from './services/audioService';

// 绘制圆角矩形
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill?: string | CanvasGradient, stroke?: string | CanvasGradient) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}

// 绘制旋转的矩形（用于剑、飞刀等）
function drawRotatedRect(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle * Math.PI / 180);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawTopBar(ctx: CanvasRenderingContext2D, timer: number, score: number, player: any, menuBtnState: string, isMuted: boolean) {
  // 顶部背景条
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 750, 70);
  
  // 血条 (左侧)
  const hpW = 200;
  const hpH = 20;
  drawRoundRect(ctx, 20, 25, hpW, hpH, 10, 'rgba(255,255,255,0.1)');
  const hpProgress = player.hp / player.maxHp;
  if (hpProgress > 0) {
    drawRoundRect(ctx, 20, 25, hpW * hpProgress, hpH, 10, '#ef4444');
  }

  // 倒计时 (居中)
  const remainingSeconds = Math.max(0, Math.ceil((180000 - timer) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(timeText, 375, 48);

  // 击杀数/得分 (右侧偏左)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`得分: ${score}`, 600, 45);

  // 静音按钮
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isMuted ? '🔇' : '🔊', 630, 45);
  
  // 菜单按钮 (最右侧)
  drawMenuButton(ctx, 660, 15, menuBtnState);
}

function drawMenuButton(ctx: CanvasRenderingContext2D, x: number, y: number, state: string) {
  const w = 80, h = 40, r = 8;
  const scale = state === 'pressed' ? 0.95 : 1;
  
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.scale(scale, scale);
  ctx.translate(-(x + w/2), -(y + h/2));

  // 背景
  ctx.fillStyle = state === 'normal' ? '#333' : '#555';
  ctx.beginPath();
  // @ts-ignore
  if (ctx.roundRect) {
    // @ts-ignore
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  
  // 文字
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('菜单', x + w/2, y + 26);
  ctx.restore();
}

function drawPauseMenu(ctx: CanvasRenderingContext2D, hoveredIndex: number | null) {
  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 750, 1334);
  
  // 面板
  const w = 400, h = 450;
  const x = (750 - w) / 2, y = (1334 - h) / 2;
  drawRoundRect(ctx, x, y, w, h, 20, '#1c1c1c', 'white');
  
  // 标题
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('游戏暂停', 375, y + 80);
  
  // 按钮
  const btnW = 300, btnH = 60;
  const btnX = (750 - btnW) / 2;
  
  const buttons = [
    { text: '继续游戏', id: 200 },
    { text: '返回主菜单', id: 201 },
    { text: '重新开始', id: 202 }
  ];
  
  buttons.forEach((btn, i) => {
    const btnY = y + 150 + i * 90;
    const isHovered = hoveredIndex === btn.id;
    drawRoundRect(ctx, btnX, btnY, btnW, btnH, 30, isHovered ? '#444' : '#333', 'white');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(btn.text, 375, btnY + 38);
  });
}

function drawLevelUp(ctx: CanvasRenderingContext2D, options: Skill[], hoveredIndex: number | null) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, 750, 1334);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('等级提升！', 375, 150);
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText('选择一个技能', 375, 200);

  const cardW = 280;
  const cardH = 340;
  const spacing = 40;
  const totalW = options.length <= 3 ? (cardW * options.length + spacing * (options.length - 1)) : (cardW * 2 + spacing);

  options.forEach((skill, i) => {
    let x, y;
    if (options.length <= 3) {
      x = (750 - totalW) / 2 + i * (cardW + spacing);
      y = (1334 - cardH) / 2;
    } else {
      const col = i % 2;
      const row = Math.floor(i / 2);
      x = (750 - totalW) / 2 + col * (cardW + spacing);
      y = (1334 - (cardH * 2 + spacing)) / 2 + row * (cardH + spacing);
    }

    const isHovered = hoveredIndex === i;
    drawRoundRect(ctx, x, y, cardW, cardH, 20, isHovered ? '#2d2d2d' : '#1c1c1c', isHovered ? '#6366f1' : 'rgba(255,255,255,0.1)');

    drawSkillIcon(ctx, x + cardW / 2, y + 80, skill, 100);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(skill.name, x + cardW / 2, y + 160);

    ctx.fillStyle = '#4caf50';
    ctx.font = '18px sans-serif';
    ctx.fillText(`等级 ${skill.level + 1}`, x + cardW / 2, y + 190);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px sans-serif';
    const lines = skill.description.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x + cardW / 2, y + 230 + li * 24);
    });
  });
}

function drawGameOver(ctx: CanvasRenderingContext2D, score: number, time: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, 750, 1334);

  const y = 400;
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('战败', 375, y);

  ctx.fillStyle = '#aaa';
  ctx.font = '24px sans-serif';
  ctx.fillText(`你坚持了 ${time}`, 375, y + 60);

  const statsY = y + 150;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(375 - 160, statsY, 150, 100);
  ctx.fillRect(375 + 10, statsY, 150, 100);

  ctx.fillStyle = '#666';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('得分', 375 - 85, statsY + 30);
  ctx.fillText('击杀', 375 + 85, statsY + 30);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px monospace';
  ctx.fillText(score.toString(), 375 - 85, statsY + 70);
  ctx.fillText(Math.floor(score / 10).toString(), 375 + 85, statsY + 70);

  const btnW = 300, btnH = 60;
  const btnX = (750 - btnW) / 2;
  const btnY = y + 350;
  drawRoundRect(ctx, btnX, btnY, btnW, btnH, 30, '#333', 'white');
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('返回主菜单', 375, btnY + 38);
}

// 绘制多边形（三角形、菱形、五角星等）
function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, sides: number, color: string, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) + rotation - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 绘制发光效果（外圈渐变）
function drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, intensity = 0.3) {
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = intensity;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSkillIcon(ctx: CanvasRenderingContext2D, x: number, y: number, skill: Skill, size: number = 80) {
  ctx.save();
  ctx.translate(x, y);
  
  const r = size * 0.2;
  let bgColor = '#263238';
  
  // Background colors from spec
  switch(skill.id) {
    case 'knife': bgColor = '#1a237e'; break;
    case 'fireball': bgColor = '#b71c1c'; break;
    case 'lightning': bgColor = '#4a148c'; break;
    case 'sword': bgColor = '#1b5e20'; break;
    case 'homing': bgColor = '#311b92'; break;
    case 'spike': bgColor = '#7f0000'; break;
    case 'bomb': bgColor = '#424242'; break;
    case 'speed': bgColor = '#004d40'; break;
    case 'range': bgColor = '#bf360c'; break;
    case 'magnet': bgColor = '#01579b'; break;
    case 'heal': bgColor = '#880e4f'; break;
    case 'sprint': bgColor = '#f57f17'; break;
    case 'rage': bgColor = '#b71c1c'; break;
    case 'exp_magnet': bgColor = '#01579b'; break;
    case 'double_upgrade': bgColor = '#4a148c'; break;
  }

  drawRoundRect(ctx, -size/2, -size/2, size, size, r, bgColor);

  // Center icon
  ctx.fillStyle = 'white';
  const iconSize = size * 0.6;

  if (skill.id === 'knife') {
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(-iconSize/8, -iconSize/2, iconSize/4, iconSize);
    ctx.restore();
    // Speed lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    for(let i=0; i<3; i++) {
      ctx.beginPath();
      ctx.moveTo(-iconSize/2, -iconSize/4 + i*iconSize/4);
      ctx.lineTo(-iconSize, -iconSize/4 + i*iconSize/4);
      ctx.stroke();
    }
  } else if (skill.id === 'fireball') {
    ctx.fillStyle = '#ff5722';
    ctx.beginPath(); ctx.arc(0, 0, iconSize/2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff9800';
    ctx.beginPath(); ctx.arc(iconSize/4, -iconSize/4, iconSize/3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffc107';
    ctx.beginPath(); ctx.arc(-iconSize/4, iconSize/4, iconSize/4, 0, Math.PI*2); ctx.fill();
  } else if (skill.id === 'lightning') {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-iconSize/3, -iconSize/2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-iconSize/4, iconSize/8);
    ctx.lineTo(iconSize/3, iconSize/2);
    ctx.stroke();
    drawGlow(ctx, 0, 0, iconSize/2, '#9c27b0', 0.5);
  } else if (skill.id === 'sword') {
    ctx.save();
    ctx.rotate(Math.PI/4);
    ctx.fillStyle = 'white';
    ctx.fillRect(-2, -iconSize/2, 4, iconSize);
    ctx.rotate(-Math.PI/2);
    ctx.fillRect(-2, -iconSize/2, 4, iconSize);
    ctx.restore();
    ctx.strokeStyle = '#00e676';
    ctx.beginPath(); ctx.arc(0, 0, iconSize/1.5, 0, Math.PI); ctx.stroke();
  } else if (skill.id === 'homing') {
    drawPolygon(ctx, 0, 0, iconSize/2, 4, '#7c4dff', Date.now() / 500);
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.fill();
  } else if (skill.id === 'spike') {
    drawPolygon(ctx, 0, 0, iconSize/2, 3, '#d32f2f');
    ctx.strokeStyle = '#d32f2f';
    ctx.beginPath(); ctx.arc(0, iconSize/2, iconSize/2, Math.PI, 0); ctx.stroke();
  } else if (skill.id === 'bomb') {
    ctx.fillStyle = '#212121';
    ctx.beginPath(); ctx.arc(0, 0, iconSize/2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -iconSize/2); ctx.lineTo(iconSize/4, -iconSize/1.5); ctx.stroke();
  } else if (skill.id === 'speed') {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-iconSize/2, 0);
    ctx.bezierCurveTo(-iconSize/2, -iconSize/2, 0, -iconSize/2, iconSize/2, -iconSize/4);
    ctx.bezierCurveTo(0, 0, -iconSize/2, iconSize/4, -iconSize/2, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-iconSize/2, iconSize/4);
    ctx.bezierCurveTo(-iconSize/2, 0, 0, 0, iconSize/3, iconSize/4);
    ctx.bezierCurveTo(0, iconSize/2, -iconSize/2, iconSize/2, -iconSize/2, iconSize/4);
    ctx.fill();
  } else if (skill.id === 'range') {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, iconSize/2, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-iconSize/2, 0); ctx.lineTo(iconSize/2, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -iconSize/2); ctx.lineTo(0, iconSize/2); ctx.stroke();
  } else if (skill.id === 'magnet' || skill.id === 'exp_magnet') {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, iconSize/2, Math.PI, 0);
    ctx.lineTo(iconSize/2, iconSize/2);
    ctx.moveTo(-iconSize/2, 0);
    ctx.lineTo(-iconSize/2, iconSize/2);
    ctx.stroke();
  } else if (skill.id === 'heal') {
    ctx.fillStyle = 'white';
    ctx.fillRect(-2, -iconSize/2, 4, iconSize);
    ctx.fillRect(-iconSize/2, -2, iconSize, 4);
  } else if (skill.id === 'sprint') {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, -iconSize/2);
    ctx.lineTo(iconSize/3, iconSize/2);
    ctx.lineTo(0, iconSize/3);
    ctx.lineTo(-iconSize/3, iconSize/2);
    ctx.closePath();
    ctx.fill();
  } else if (skill.id === 'rage') {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-iconSize/2, -iconSize/1.5, -iconSize, 0, 0, iconSize/1.5);
    ctx.bezierCurveTo(iconSize, 0, iconSize/2, -iconSize/1.5, 0, 0);
    ctx.fill();
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-iconSize/2, 0); ctx.lineTo(iconSize/2, 0); ctx.stroke();
  } else if (skill.id === 'double_upgrade') {
    for(let i=0; i<2; i++) {
      for(let j=0; j<2; j++) {
        ctx.fillStyle = 'white';
        ctx.fillRect(-iconSize/2 + i*iconSize/1.5, -iconSize/2 + j*iconSize/1.5, iconSize/3, iconSize/3);
      }
    }
  }

  ctx.restore();
}

function drawVortex(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const time = Date.now() / 1000;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(156,39,176,${0.3 - i * 0.1})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const r = 50 + i * 30 + Math.sin(angle * 3 + time * (i + 1)) * 10;
      const x = cx + Math.cos(angle + time * (0.5 + i * 0.2)) * r;
      const y = cy + Math.sin(angle + time * (0.5 + i * 0.2)) * r;
      if (angle === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#4caf50';
  ctx.fillStyle = 'rgba(76,175,80,0.3)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawLava(ctx: CanvasRenderingContext2D, height: number) {
  const gradient = ctx.createLinearGradient(0, 1334 - height, 0, 1334);
  gradient.addColorStop(0, 'rgba(255,87,34,0)');
  gradient.addColorStop(0.5, 'rgba(255,87,34,0.5)');
  gradient.addColorStop(1, 'rgba(183,28,28,0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 1334 - height, 750, height);
  
  for (let i = 0; i < 5; i++) {
    const bx = (Date.now() / 50 + i * 150) % 750;
    const by = 1334 - height - 10 - Math.sin(Date.now() / 200 + i) * 5;
    ctx.fillStyle = 'rgba(255,193,7,0.6)';
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLaser(ctx: CanvasRenderingContext2D, y: number, state: string, progress: number) {
  if (state === 'warning') {
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = `rgba(255,0,0,${0.3 + progress * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(750, y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (state === 'active') {
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(750, y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawLevelSelect(ctx: CanvasRenderingContext2D, selectedLevelId: string, unlockedLevelIds: string[], hoveredIndex: number | null, mousePos: { x: number, y: number }) {
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, 750, 1334);

  // Parallax Background
  const selectedLevel = LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0];
  const parallaxX = (mousePos.x - 375) * 0.05;
  const parallaxY = (mousePos.y - 667) * 0.05;

  ctx.save();
  ctx.translate(parallaxX, parallaxY);
  // Draw subtle background elements for parallax
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc((i * 137) % 1000 - 125, (i * 251) % 1500 - 100, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Left List
  const listW = 250;
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, listW, 1334);

  LEVELS.forEach((level, i) => {
    const isSelected = level.id === selectedLevelId;
    const isHovered = hoveredIndex === i;
    const isUnlocked = unlockedLevelIds.includes(level.id);
    
    ctx.fillStyle = isSelected ? '#455a64' : (isHovered ? '#37474f' : '#1c1c1c');
    ctx.fillRect(0, i * 100, listW, 100);
    
    // Thumbnail
    ctx.fillStyle = level.theme.bgColor;
    ctx.fillRect(10, i * 100 + 20, 60, 60);
    ctx.strokeStyle = level.theme.groundColor;
    ctx.strokeRect(10, i * 100 + 20, 60, 60);

    ctx.fillStyle = isUnlocked ? 'white' : '#666';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(level.name, 80, i * 100 + 45);
    
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.fillText(level.duration === 0 ? '无限' : `${Math.floor(level.duration / 60)}:00`, 80, i * 100 + 75);

    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, i * 100, listW, 100);
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', listW / 2, i * 100 + 60);
    }
  });

  // Right Preview
  const isUnlocked = unlockedLevelIds.includes(selectedLevel.id);
  const previewX = listW;
  const previewW = 750 - listW;

  // Gradient Background
  const grad = ctx.createLinearGradient(previewX, 0, 750, 1334);
  grad.addColorStop(0, selectedLevel.theme.bgColor);
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(previewX, 0, previewW, 1334);

  // Info Panel
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(selectedLevel.name, previewX + previewW / 2, 100);

  ctx.fillStyle = '#ccc';
  ctx.font = '18px sans-serif';
  const lines = selectedLevel.description.match(/.{1,15}/g) || [];
  lines.forEach((line, i) => {
    ctx.fillText(line, previewX + previewW / 2, 160 + i * 25);
  });

  // Special Rules
  if (selectedLevel.specialRules) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('特殊机制', previewX + previewW / 2, 300);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    selectedLevel.specialRules.forEach((rule, i) => {
      ctx.fillText(`• ${rule}`, previewX + previewW / 2, 330 + i * 30);
    });
  }

  // Unlock Condition
  if (!isUnlocked) {
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`解锁条件: ${selectedLevel.unlockCondition}`, previewX + previewW / 2, 500);
  } else {
    // Start Button
    const btnW = 250;
    const btnH = 80;
    const btnX = previewX + (previewW - btnW) / 2;
    const btnY = 600;
    const isBtnHovered = hoveredIndex === 1000;
    
    drawRoundRect(ctx, btnX, btnY, btnW, btnH, 40, isBtnHovered ? '#4caf50' : '#388e3c', 'white');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('开始挑战', previewX + previewW / 2, btnY + 50);
  }

  // Back Button
  const backW = 150;
  const backH = 50;
  const backX = previewX + (previewW - backW) / 2;
  const backY = 1334 - 100;
  const isBackHovered = hoveredIndex === 1001;
  drawRoundRect(ctx, backX, backY, backW, backH, 25, isBackHovered ? '#333' : '#222', 'white');
  ctx.fillStyle = 'white';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('返回', previewX + previewW / 2, backY + 32);
}

const GAME_WIDTH = 750;

const GAME_HEIGHT = 1334;

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'LEVEL_UP' | 'GAME_OVER' | 'VICTORY' | 'REVIVE' | 'CHARACTER_SELECT' | 'LEVEL_SELECT' | 'PAUSED' | 'ACHIEVEMENTS'>('START');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [menuBtnState, setMenuBtnState] = useState<'normal' | 'pressed'>('normal');
  const [totalKills, setTotalKills] = useState(0);
  const [bossKilled, setBossKilled] = useState(false);
  const [tutorialHint, setTutorialHint] = useState<{ text: string, life: number } | null>(null);
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [unlockData, setUnlockData] = useState<{ name: string, attr: string } | null>(null);
  const [isShadowWalkerUnlocked, setIsShadowWalkerUnlocked] = useState(false);
  const [victoryTime, setVictoryTime] = useState(0);
  const [levelUpOptions, setLevelUpOptions] = useState<Skill[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [killHints, setKillHints] = useState<{ id: string, text: string, x: number, y: number, life: number }[]>([]);
  
  const [selectedCharacterId, setSelectedCharacterId] = useState('survivor');
  const [unlockedCharacterIds, setUnlockedCharacterIds] = useState(['survivor']);
  const [totalKillsEver, setTotalKillsEver] = useState(0);
  const [totalGemsEver, setTotalGemsEver] = useState(0);
  const [lastShieldTime, setLastShieldTime] = useState(0);
  const [lastTimeStasisTime, setLastTimeStasisTime] = useState(0);

  const [currentLevelId, setCurrentLevelId] = useState('city');
  const [selectedLevelId, setSelectedLevelId] = useState('city');
  const [unlockedLevelIds, setUnlockedLevelIds] = useState(['city']);
  const [totalSurvivalTime, setTotalSurvivalTime] = useState(0);
  const [lavaHeight, setLavaHeight] = useState(0);
  const [laserTraps, setLaserTraps] = useState<LaserTrap[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [gravityCenter, setGravityCenter] = useState<{ x: number, y: number } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [achievementNotification, setAchievementNotification] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const getStorage = (key: string) => {
      if (typeof wx !== 'undefined') return wx.getStorageSync(key);
      return localStorage.getItem(key);
    };
    
    const savedChars = getStorage('unlockedCharacters');
    if (savedChars) setUnlockedCharacterIds(typeof savedChars === 'string' ? JSON.parse(savedChars) : savedChars);
    const savedLevels = getStorage('unlockedLevels');
    if (savedLevels) setUnlockedLevelIds(typeof savedLevels === 'string' ? JSON.parse(savedLevels) : savedLevels);
    const savedAchievements = getStorage('unlockedAchievements');
    if (savedAchievements) setUnlockedAchievements(typeof savedAchievements === 'string' ? JSON.parse(savedAchievements) : savedAchievements);
    const savedTotalKills = getStorage('totalKillsEver');
    if (savedTotalKills) setTotalKillsEver(typeof savedTotalKills === 'number' ? savedTotalKills : parseInt(savedTotalKills));
    const savedTotalGems = getStorage('totalGemsEver');
    if (savedTotalGems) setTotalGemsEver(typeof savedTotalGems === 'number' ? savedTotalGems : parseInt(savedTotalGems));
  }, []);

  // Save data
  useEffect(() => {
    const setStorage = (key: string, value: any) => {
      if (typeof wx !== 'undefined') wx.setStorageSync(key, value);
      else localStorage.setItem(key, JSON.stringify(value));
    };
    setStorage('unlockedCharacters', unlockedCharacterIds);
  }, [unlockedCharacterIds]);

  useEffect(() => {
    const setStorage = (key: string, value: any) => {
      if (typeof wx !== 'undefined') wx.setStorageSync(key, value);
      else localStorage.setItem(key, JSON.stringify(value));
    };
    setStorage('unlockedLevels', unlockedLevelIds);
  }, [unlockedLevelIds]);

  useEffect(() => {
    const setStorage = (key: string, value: any) => {
      if (typeof wx !== 'undefined') wx.setStorageSync(key, value);
      else localStorage.setItem(key, JSON.stringify(value));
    };
    setStorage('unlockedAchievements', unlockedAchievements);
  }, [unlockedAchievements]);

  useEffect(() => {
    const setStorage = (key: string, value: any) => {
      if (typeof wx !== 'undefined') wx.setStorageSync(key, value);
      else localStorage.setItem(key, value.toString());
    };
    setStorage('totalKillsEver', totalKillsEver);
  }, [totalKillsEver]);

  useEffect(() => {
    const setStorage = (key: string, value: any) => {
      if (typeof wx !== 'undefined') wx.setStorageSync(key, value);
      else localStorage.setItem(key, value.toString());
    };
    setStorage('totalGemsEver', totalGemsEver);
  }, [totalGemsEver]);

  const unlockAchievement = (id: string) => {
    if (!unlockedAchievements.includes(id)) {
      setUnlockedAchievements(prev => [...prev, id]);
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      if (achievement) {
        setAchievementNotification(achievement.name);
        setTimeout(() => setAchievementNotification(null), 3000);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'START' || gameState === 'CHARACTER_SELECT' || gameState === 'LEVEL_SELECT') {
      audioService.playBGM('menu');
    } else if (gameState === 'PLAYING') {
      audioService.playBGM('game');
    } else if (gameState === 'GAME_OVER' || gameState === 'VICTORY') {
      audioService.stopBGM();
    }
  }, [gameState]);

  // Game Entities (Refs for performance in game loop)
  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    radius: 20,
    hp: 100,
    maxHp: 100,
    speed: 4,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    skills: [],
    attackRange: 300,
    magnetRange: 100,
    regenRate: 0.05,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const xpGemsRef = useRef<XPGem[]>([]);
  const groundSpikesRef = useRef<GroundSpike[]>([]);
  const joystickDir = useRef({ x: 0, y: 0 });
  const lastAttackTime = useRef<Record<string, number>>({});
  const lastSpawnTime = useRef(0);
  const firstKillDone = useRef(false);
  const swordAngle = useRef(0);
  const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }[]>([]);
  const requestRef = useRef<number>();

  const getCurrentPhase = (timeMs: number) => {
    const s = timeMs / 1000;
    const level = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
    const duration = level.duration;

    if (currentLevelId === 'void') {
      if (s < 30) return 'tutorial';
      if (s < 120) return 'buildup';
      return 'climax';
    }

    if (s < 30) return 'tutorial';
    if (s < duration - 60) return 'buildup';
    if (s < duration - 30) return 'climax';
    return 'boss';
  };

  const returnToMainMenu = () => {
    setGameState('START');
    enemiesRef.current = [];
    projectilesRef.current = [];
    xpGemsRef.current = [];
    setGameItems([]);
    setKillHints([]);
    setScore(0);
    setTimer(0);
    setTotalKills(0);
    setBossKilled(false);
  };

  const resetGame = (forceUnlock?: boolean) => {
    const unlocked = forceUnlock !== undefined ? forceUnlock : isShadowWalkerUnlocked;
    const char = CHARACTERS.find(c => c.id === selectedCharacterId) || CHARACTERS[0];
    const level = LEVELS.find(l => l.id === selectedLevelId) || LEVELS[0];
    
    setCurrentLevelId(level.id);
    setLavaHeight(0);
    setLaserTraps([]);
    setPlatforms([]);
    setGravityCenter(level.id === 'void' ? { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 } : null);

    if (level.id === 'volcano') {
      const newPlatforms: Platform[] = [];
      for (let i = 0; i < 3; i++) {
        newPlatforms.push({
          x: 150 + Math.random() * (GAME_WIDTH - 300),
          y: 300 + Math.random() * (GAME_HEIGHT - 600),
          radius: 80
        });
      }
      setPlatforms(newPlatforms);
    }

    playerRef.current = {
      id: 'player',
      characterId: char.id,
      pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      radius: 20,
      hp: char.stats.hp,
      maxHp: char.stats.hp,
      speed: 4 * char.stats.speed * (unlocked && char.id === 'survivor' ? 1.1 : 1),
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      skills: [JSON.parse(JSON.stringify(SKILLS.find(s => s.type === char.initialWeapon) || SKILLS[0]))],
      attackRange: 300,
      magnetRange: 100,
      regenRate: 0.05,
      shieldActive: false,
      speedBoostTimer: 0,
      timeStasisTimer: 0,
      noDamageTimer: 0,
      fireballKills: 0,
      lastSkillTime: 0,
      skillCooldown: char.id === 'time' ? 15000 : 0,
    } as Player;
    playerRef.current.skills[0].level = 1;
    
    enemiesRef.current = [];
    projectilesRef.current = [];
    xpGemsRef.current = [];
    groundSpikesRef.current = [];
    setGameItems([]);
    swordAngle.current = 0;
    setScore(0);
    setTimer(0);
    setTotalKills(0);
    setBossKilled(false);
    setTutorialHint({ text: '拖动左下角摇杆移动', life: 180 });
    setGameState('PLAYING');
    setVictoryTime(0);
    setLastShieldTime(0);
    setLastTimeStasisTime(0);
  };

  const spawnEnemy = useCallback((typeOverride?: Enemy['type']) => {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    const margin = 50;

    switch (side) {
      case 0: x = Math.random() * GAME_WIDTH; y = -margin; break;
      case 1: x = GAME_WIDTH + margin; y = Math.random() * GAME_HEIGHT; break;
      case 2: x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + margin; break;
      case 3: x = -margin; y = Math.random() * GAME_HEIGHT; break;
    }

    const timeS = timer / 1000;
    const phase = getCurrentPhase(timer);
    const level = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
    
    let type: Enemy['type'] = 'TRIANGLE';
    let hp = 20;
    let speed = 1.6;
    let radius = 15;
    let color = '#d32f2f';
    let xpValue = 20;
    let isElite = false;

    if (typeOverride) {
      type = typeOverride;
    } else {
      const levelIndex = LEVELS.findIndex(l => l.id === currentLevelId);
      const difficultyMult = 1 + levelIndex * 0.2; // 20% harder per level
      
      if (currentLevelId === 'city') {
        if (phase === 'buildup') {
          const r = Math.random();
          if (r > 0.9) type = 'COMMANDER';
          else if (r > 0.7) type = 'DIAMOND';
          else type = 'TRIANGLE';
        } else if (phase === 'climax') {
          const r = Math.random();
          if (r < 0.3) type = 'TRIANGLE';
          else if (r < 0.5) type = 'DIAMOND';
          else if (r < 0.7) type = 'CIRCLE';
          else if (r < 0.85) type = 'CHARGER';
          else type = 'SHIELD_GENERATOR';
        }
      } else if (currentLevelId === 'neon') {
        const r = Math.random();
        if (r < 0.4) type = 'EXPERIMENT';
        else if (r < 0.7) type = 'DIAMOND';
        else if (r < 0.9) type = 'CHARGER';
        else type = 'SHIELD_GENERATOR';
        if (phase === 'climax' && Math.random() > 0.8) isElite = true;
      } else if (currentLevelId === 'volcano') {
        const r = Math.random();
        if (r < 0.5) type = 'FIRE_SPIRIT';
        else if (r < 0.8) type = 'MAGMA_WORM';
        else type = 'STAR';
        if (phase === 'climax' && Math.random() > 0.8) isElite = true;
      } else if (currentLevelId === 'void') {
        const r = Math.random();
        if (r < 0.2) type = 'VOID_WALKER';
        else if (r < 0.4) type = 'COMMANDER';
        else if (r < 0.6) type = 'STAR';
        else if (r < 0.8) type = 'EXPERIMENT';
        else type = 'FIRE_SPIRIT';
      } else if (currentLevelId === 'boss_rush') {
        // Boss rush handles spawning differently usually, but let's add some fodder
        type = Math.random() > 0.5 ? 'STAR' : 'COMMANDER';
      }

    }

    if (type === 'DIAMOND') {
      hp = 15; speed = 2.5; color = '#1976d2'; radius = 15; xpValue = 25;
    } else if (type === 'CIRCLE') {
      hp = 50; speed = 1.0; color = '#388e3c'; radius = 18; xpValue = 35;
    } else if (type === 'EXPERIMENT') {
      hp = isElite ? 150 : 40; speed = 1.2; color = isElite ? '#7b1fa2' : '#00bcd4'; radius = isElite ? 30 : 20; xpValue = isElite ? 100 : 30;
    } else if (type === 'FIRE_SPIRIT') {
      hp = 30; speed = 2.0; color = '#ff5722'; radius = 15; xpValue = 25;
    } else if (type === 'MAGMA_WORM') {
      hp = 60; speed = 0.8; color = '#ff9800'; radius = 20; xpValue = 40;
    } else if (type === 'VOID_WALKER') {
      hp = 200; speed = 1.5; color = '#000000'; radius = 25; xpValue = 150; isElite = true;
    } else if (type === 'STAR') {
      hp = 100; speed = 1.3; color = '#fbc02d'; radius = 25; xpValue = 150; isElite = true;
    } else if (type === 'BOSS') {
      hp = 500; speed = 1.3; color = '#7b1fa2'; radius = 80; xpValue = 500;
      x = GAME_WIDTH / 2; y = -100;
    } else if (type === 'SHIELD_GENERATOR') {
      hp = 80; speed = 1.0; color = '#00bcd4'; radius = 22; xpValue = 50;
    } else if (type === 'CHARGER') {
      hp = 40; speed = 1.8; color = '#ff1744'; radius = 18; xpValue = 40;
    } else if (type === 'COMMANDER') {
      hp = 120; speed = 1.2; color = '#ffeb3b'; radius = 25; xpValue = 100; isElite = true;
    }

    // Apply difficulty multiplier based on level index
    const levelIndex = LEVELS.findIndex(l => l.id === currentLevelId);
    const difficultyMult = 1 + levelIndex * 0.2; // 20% harder per level
    
    if (type !== 'BOSS') {
      hp *= difficultyMult;
      speed *= (1 + levelIndex * 0.05);
      xpValue *= (1 + levelIndex * 0.1);
    } else {
      // Bosses also scale but slightly less
      hp *= (1 + levelIndex * 0.1);
    }

    // Void Rift scaling
    if (currentLevelId === 'void') {
      const minutes = timeS / 60;
      hp *= Math.pow(1.1, minutes);
      speed *= Math.pow(1.05, minutes);
    }

    const enemy: Enemy = {
      id: Math.random().toString(36),
      pos: { x, y },
      radius,
      hp,
      maxHp: hp,
      speed,
      damage: type === 'BOSS' ? 30 : 10,
      xpValue,
      type,
      color,
      isElite,
      sprintTimer: 0,
      shootTimer: 0,
      phase: 'normal',
      wormSegments: type === 'MAGMA_WORM' ? [{ x, y }, { x, y }, { x, y }] : undefined,
      teleportTimer: type === 'VOID_WALKER' ? 120 : undefined,
      chargeTimer: type === 'CHARGER' ? 0 : undefined,
      isCharging: type === 'CHARGER' ? false : undefined,
    };
    enemiesRef.current.push(enemy);
  }, [timer, currentLevelId]);

  const fireWeapon = (type: WeaponType, level: number) => {
    const player = playerRef.current;
    // Find nearest enemy
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    enemiesRef.current.forEach(e => {
      const dx = e.pos.x - player.pos.x;
      const dy = e.pos.y - player.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist && d < player.attackRange) {
        minDist = d;
        nearest = e;
      }
    });

    if (!nearest && type !== WeaponType.SPIKE) return;

    const dx = nearest ? nearest.pos.x - player.pos.x : 0;
    const dy = nearest ? nearest.pos.y - player.pos.y : 0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dir = { x: dist > 0 ? dx / dist : 1, y: dist > 0 ? dy / dist : 0 };

    if (type === WeaponType.KNIFE) {
      audioService.playShoot();
      const count = 1 + Math.floor(level / 2);
      for (let i = 0; i < count; i++) {
        const angleOffset = (i - (count - 1) / 2) * 0.2;
        const cos = Math.cos(angleOffset);
        const sin = Math.sin(angleOffset);
        const vx = (dir.x * cos - dir.y * sin) * 10;
        const vy = (dir.x * sin + dir.y * cos) * 10;

        projectilesRef.current.push({
          id: Math.random().toString(),
          pos: { ...player.pos },
          vel: { x: vx, y: vy },
          damage: 10 + level * 5,
          radius: 8,
          type: WeaponType.KNIFE,
          pierce: 1 + Math.floor(level / 3),
          lifeTime: 100,
          color: '#6366f1',
        });
      }
    } else if (type === WeaponType.FIREBALL) {
      audioService.playShoot();
      projectilesRef.current.push({
        id: Math.random().toString(),
        pos: { ...player.pos },
        vel: { x: dir.x * 6, y: dir.y * 6 },
        damage: 20 + level * 10,
        radius: 12,
        type: WeaponType.FIREBALL,
        pierce: 0,
        lifeTime: 150,
        color: '#f97316',
        explosionRadius: 80 + level * 20,
      });
    } else if (type === WeaponType.LIGHTNING) {
      audioService.playLightning();
      const damage = 15 + level * 8;
      if (nearest) {
        nearest.hp -= damage;
        projectilesRef.current.push({
          id: Math.random().toString(),
          pos: { ...nearest.pos },
          vel: { x: 0, y: 0 },
          damage: 0,
          radius: 20,
          type: WeaponType.LIGHTNING,
          pierce: 0,
          lifeTime: 20,
          color: '#eab308',
        });
      }
    } else if (type === WeaponType.HOMING) {
      audioService.playShoot();
      const count = level >= 2 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        projectilesRef.current.push({
          id: Math.random().toString(),
          pos: { ...player.pos },
          vel: { x: (dir.x + (Math.random() - 0.5) * 0.5) * 5, y: (dir.y + (Math.random() - 0.5) * 0.5) * 5 },
          damage: 12 + level * 4,
          radius: 8,
          type: WeaponType.HOMING,
          pierce: level >= 5 ? 2 : 1,
          lifeTime: 200,
          color: '#a855f7',
        });
      }
    } else if (type === WeaponType.SPIKE) {
      audioService.playShoot();
      let spikePos = { x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT };
      let attempts = 0;
      while (attempts < 10) {
        const d = Math.sqrt((spikePos.x - player.pos.x)**2 + (spikePos.y - player.pos.y)**2);
        if (d > 200) break;
        spikePos = { x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT };
        attempts++;
      }
      groundSpikesRef.current.push({
        id: Math.random().toString(),
        pos: spikePos,
        radius: level >= 2 ? 104 : 80,
        state: 'WARNING',
        timer: 30, // 0.5s at 60fps
        damage: 25,
      });
    } else if (type === WeaponType.BOMB) {
      audioService.playShoot();
      const flightTime = 48; // 0.8s
      const targetPos = nearest ? { ...nearest.pos } : { x: player.pos.x + dir.x * 200, y: player.pos.y + dir.y * 200 };
      const vx = (targetPos.x - player.pos.x) / flightTime;
      const vy = (targetPos.y - player.pos.y) / flightTime;
      
      projectilesRef.current.push({
        id: Math.random().toString(),
        pos: { ...player.pos },
        vel: { x: vx, y: vy },
        damage: 30,
        radius: 10,
        type: WeaponType.BOMB,
        pierce: 0,
        lifeTime: flightTime,
        color: '#18181b',
        explosionRadius: level >= 2 ? 180 : 120,
      });
    }
  };

  const update = useCallback(() => {
    setKillHints(prev => prev.map(h => ({ ...h, y: h.y - 0.5, life: h.life - 1 })).filter(h => h.life > 0));

    if (gameState !== 'PLAYING') {
      return;
    }

    const player = playerRef.current;
    const now = Date.now();
    let phase = getCurrentPhase(timer);

    // Clear shields at start of frame
    enemiesRef.current.forEach(e => e.shieldedBy = undefined);

    // Passive: Sprint
    let currentSpeed = player.speed;
    if (timer < 30000 && player.skills.some(s => s.id === 'sprint')) {
      currentSpeed *= 1.5;
    }

    // Player Movement
    player.pos.x += joystickDir.current.x * currentSpeed;
    player.pos.y += joystickDir.current.y * currentSpeed;

    // Level Specific Logic: Gravity
    if (currentLevelId === 'void' && gravityCenter) {
      const dx = gravityCenter.x - player.pos.x;
      const dy = gravityCenter.y - player.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0) {
        const force = 0.5 * (1 - Math.min(1, d / 400));
        player.pos.x += (dx / d) * force;
        player.pos.y += (dy / d) * force;
      }
    }

    player.pos.x = Math.max(0, Math.min(GAME_WIDTH, player.pos.x));
    player.pos.y = Math.max(0, Math.min(GAME_HEIGHT, player.pos.y));

    // Level Specific Logic: Lava
    if (currentLevelId === 'volcano') {
      setLavaHeight(prev => Math.min(GAME_HEIGHT, prev + 0.1));
      const onPlatform = platforms.some(p => 
        player.pos.x >= p.x && player.pos.x <= p.x + p.w &&
        player.pos.y >= p.y && player.pos.y <= p.y + p.h
      );
      if (player.pos.y > GAME_HEIGHT - lavaHeight && !onPlatform) {
        player.hp -= 0.5;
        if (Math.random() < 0.1) audioService.playHit();
      }
    }

    // Level Specific Logic: Lasers
    if (currentLevelId === 'neon') {
      laserTraps.forEach(trap => {
        trap.timer--;
        if (trap.timer <= 0) {
          trap.active = !trap.active;
          trap.timer = trap.active ? 120 : 180;
        }
        if (trap.active) {
          const dx = player.pos.x - trap.x;
          const dy = player.pos.y - trap.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < player.radius + 5) {
            player.hp -= 1;
            if (Math.random() < 0.1) audioService.playHit();
          }
        }
      });
    }

    // Regen
    player.hp = Math.min(player.maxHp, player.hp + player.regenRate);

    // Passive: Rage
    let attackSpeedMult = 1;
    if (player.hp / player.maxHp < 0.2 && player.skills.some(s => s.id === 'rage')) {
      attackSpeedMult = 2;
    }
    
    // Character: Berserker passive
    if (player.characterId === 'berserker') {
      const hpPercent = player.hp / player.maxHp;
      const missingHp = 1 - hpPercent;
      const boost = Math.min(0.5, Math.floor(missingHp * 10) * 0.05);
      attackSpeedMult *= (1 + boost);
    }

    // Character: Base attack interval
    const char = CHARACTERS.find(c => c.id === player.characterId);
    if (char) {
      attackSpeedMult /= char.stats.attackInterval;
    }

    // Auto Attack
    player.skills.forEach(skill => {
      if (skill.type in WeaponType && skill.type !== WeaponType.SWORD) {
        let cooldown = 1000 - (skill.level * 100);
        if (skill.id === 'spike' && skill.level >= 5) cooldown = 750;
        else if (skill.id === 'spike') cooldown = 3000;
        
        if (!lastAttackTime.current[skill.id] || now - lastAttackTime.current[skill.id] > (cooldown / attackSpeedMult)) {
          fireWeapon(skill.type as WeaponType, skill.level);
          lastAttackTime.current[skill.id] = now;
        }
      }
    });

    // Sword Rotation
    const swordSkill = player.skills.find(s => s.id === 'sword');
    if (swordSkill) {
      swordAngle.current += (Math.PI * 2) / 60; // 360 deg/sec
      const swordCount = swordSkill.level >= 2 ? 3 : 2;
      const swordHeight = swordSkill.level >= 5 ? 60 : 40;
      const swordRadius = 60;
      
      for (let i = 0; i < swordCount; i++) {
        const angle = swordAngle.current + (i * Math.PI * 2) / swordCount;
        const sx = player.pos.x + Math.cos(angle) * swordRadius;
        const sy = player.pos.y + Math.sin(angle) * swordRadius;
        
        // Collision with enemies
        enemiesRef.current.forEach(e => {
          const dx = e.pos.x - sx;
          const dy = e.pos.y - sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < e.radius + 20) {
            const swordCooldownKey = `sword_hit_${e.id}`;
            if (!lastAttackTime.current[swordCooldownKey] || now - lastAttackTime.current[swordCooldownKey] > 200) {
            if (!e.shieldedBy) {
              e.hp -= 15;
            }
              lastAttackTime.current[swordCooldownKey] = now;
            }
          }
        });
      }
    }

    // Ground Spikes
    groundSpikesRef.current = groundSpikesRef.current.filter(spike => {
      spike.timer--;
      if (spike.state === 'WARNING' && spike.timer <= 0) {
        spike.state = 'ACTIVE';
        spike.timer = 60; // 1s
      }
      
      if (spike.state === 'ACTIVE') {
        enemiesRef.current.forEach(e => {
          const dx = e.pos.x - spike.pos.x;
          const dy = e.pos.y - spike.pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < e.radius + spike.radius) {
            const spikeHitKey = `spike_hit_${e.id}_${spike.id}`;
            if (!lastAttackTime.current[spikeHitKey] || now - lastAttackTime.current[spikeHitKey] > 500) {
            if (!e.shieldedBy) {
              e.hp -= spike.damage;
            }
              lastAttackTime.current[spikeHitKey] = now;
            }
          }
        });
      }
      
      return spike.timer > 0 || spike.state === 'WARNING';
    });

    // Character Mechanics
    if (player.characterId === 'mechanic') {
      if (!player.shieldActive && now - lastShieldTime > 30000) {
        player.shieldActive = true;
        setLastShieldTime(now);
      }
    }
    if (player.characterId === 'shadow' && player.speedBoostTimer! > 0) {
      player.speedBoostTimer!--;
      if (player.speedBoostTimer === 0) {
        const char = CHARACTERS.find(c => c.id === 'shadow')!;
        player.speed = 4 * char.stats.speed;
      }
    }
    if (player.characterId === 'time' && player.timeStasisTimer! > 0) {
      player.timeStasisTimer!--;
    }
    if (player.characterId === 'berserker') {
      const rageLevel = 1 - player.hp / player.maxHp;
      // Attack speed handled in weapon firing logic
    }
    
    // Time Traveler Unlock Check
    if (phase === 'boss' && !player.noDamageTimer) {
      player.noDamageTimer = 0;
    }
    if (phase === 'boss') {
      player.noDamageTimer!++;
      if (player.noDamageTimer! >= 1800) { // 30s at 60fps
        if (!unlockedCharacterIds.includes('time')) {
          setUnlockedCharacterIds(prev => [...prev, 'time']);
          setUnlockData({ name: '瞬', attr: '时间缓滞' });
        }
      }
    }

    // Enemies
    enemiesRef.current.forEach(enemy => {
      const dx = player.pos.x - enemy.pos.x;
      const dy = player.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let moveSpeed = enemy.speed;
      if (player.timeStasisTimer! > 0) moveSpeed *= 0.5;

      // SHIELD_GENERATOR
      if (enemy.type === 'SHIELD_GENERATOR') {
        enemiesRef.current.forEach(other => {
          if (other.id !== enemy.id && other.type !== 'SHIELD_GENERATOR') {
            const ddx = other.pos.x - enemy.pos.x;
            const ddy = other.pos.y - enemy.pos.y;
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (ddist < 200) {
              other.shieldedBy = enemy.id;
            }
          }
        });
      }

      // CHARGER
      if (enemy.type === 'CHARGER') {
        if (!enemy.isCharging) {
          enemy.chargeTimer = (enemy.chargeTimer || 0) + 1;
          if (enemy.chargeTimer >= 180) { // 3s
            enemy.isCharging = true;
            enemy.chargeTimer = 60; // 1s charge duration
            const cdx = player.pos.x - enemy.pos.x;
            const cdy = player.pos.y - enemy.pos.y;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            // @ts-ignore
            enemy.chargeVel = { x: (cdx / cdist) * 8, y: (cdy / cdist) * 8 };
          }
        } else {
          moveSpeed = 0;
          // @ts-ignore
          enemy.pos.x += enemy.chargeVel.x;
          // @ts-ignore
          enemy.pos.y += enemy.chargeVel.y;
          enemy.chargeTimer!--;
          if (enemy.chargeTimer <= 0) {
            enemy.isCharging = false;
            enemy.chargeTimer = 0;
          }
        }
      }

      // COMMANDER
      if (enemy.type === 'COMMANDER') {
        enemiesRef.current.forEach(other => {
          if (other.id !== enemy.id) {
            const ddx = other.pos.x - enemy.pos.x;
            const ddy = other.pos.y - enemy.pos.y;
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (ddist < 70) {
              other.buffTimer = 60;
            }
          }
        });
      }

      // Apply Buffs
      if (enemy.buffTimer! > 0) {
        moveSpeed *= 1.5;
        enemy.buffTimer!--;
      }

      // DIAMOND Sprint
      if (enemy.type === 'DIAMOND') {
        if (dist < 200 && enemy.sprintTimer! <= 0) {
          enemy.sprintTimer = 120; // 2s
        }
        if (enemy.sprintTimer! > 0) {
          moveSpeed = 4.2; // ~250px/s
          enemy.sprintTimer!--;
        }
      }

      // CIRCLE Ranged
      if (enemy.type === 'CIRCLE') {
        enemy.shootTimer!++;
        if (enemy.shootTimer! >= 120) { // 2s
          // Burst of 3
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              const bdx = player.pos.x - enemy.pos.x;
              const bdy = player.pos.y - enemy.pos.y;
              const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
              projectilesRef.current.push({
                id: Math.random().toString(),
                pos: { ...enemy.pos },
                vel: { x: (bdx / bdist) * 3, y: (bdy / bdist) * 3 },
                damage: 10,
                radius: 6,
                type: WeaponType.FIREBALL,
                pierce: 0,
                lifeTime: 100,
                color: '#388e3c',
              });
            }, i * 200);
          }
          enemy.shootTimer = 0;
        }
        // Keep distance
        if (dist < 150) moveSpeed = -enemy.speed;
        else if (dist < 250) moveSpeed = 0;
      }

      // VOID_WALKER Teleport
      if (enemy.type === 'VOID_WALKER') {
        enemy.teleportTimer!--;
        if (enemy.teleportTimer! <= 0) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 150 + Math.random() * 100;
          enemy.pos.x = player.pos.x + Math.cos(angle) * dist;
          enemy.pos.y = player.pos.y + Math.sin(angle) * dist;
          enemy.teleportTimer = 180;
          // Teleport particles
          for (let i = 0; i < 10; i++) {
            particlesRef.current.push({
              x: enemy.pos.x, y: enemy.pos.y,
              vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
              life: 20, color: '#a855f7', size: 3
            });
          }
        }
      }

      // FIRE_SPIRIT Self-destruct
      if (enemy.type === 'FIRE_SPIRIT') {
        if (dist < 50) {
          enemy.hp = 0; // Trigger death logic
          player.hp -= 20;
          audioService.playHit();
          // Explosion particles
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
              x: enemy.pos.x, y: enemy.pos.y,
              vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
              life: 30, color: '#ff5722', size: 5
            });
          }
        }
      }

      // MAGMA_WORM Segments
      if (enemy.type === 'MAGMA_WORM' && enemy.wormSegments) {
        let prev = { ...enemy.pos };
        for (let i = 0; i < enemy.wormSegments.length; i++) {
          const seg = enemy.wormSegments[i];
          const sdx = prev.x - seg.x;
          const sdy = prev.y - seg.y;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sd > 20) {
            seg.x += (sdx / sd) * (sd - 20);
            seg.y += (sdy / sd) * (sd - 20);
          }
          prev = { ...seg };
          // Collision with segments
          const pdx = player.pos.x - seg.x;
          const pdy = player.pos.y - seg.y;
          const pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < player.radius + 15) {
            player.hp -= 0.2;
            if (Math.random() < 0.05) audioService.playHit();
          }
        }
      }

      // BOSS Logic
      if (enemy.type === 'BOSS') {
        // Rage particles
        if (enemy.phase === 'rage' && Math.random() < 0.2) {
          const pAngle = Math.random() * Math.PI * 2;
          particlesRef.current.push({
            x: enemy.pos.x,
            y: enemy.pos.y,
            vx: Math.cos(pAngle) * 2,
            vy: Math.sin(pAngle) * 2,
            life: 30,
            color: '#d500f9',
            size: 4
          });
        }

        // Entry animation
        if (enemy.pos.y < GAME_HEIGHT / 4) {
          enemy.pos.y += 2;
        } else {
          enemy.pos.x += (dx / dist) * moveSpeed;
          enemy.pos.y += (dy / dist) * moveSpeed;
        }

        // Phases
        if (enemy.hp < enemy.maxHp * 0.25) enemy.phase = 'rage';
        else enemy.phase = 'normal';

        if (enemy.phase === 'rage') {
          moveSpeed = enemy.speed * 1.5;
        }

        enemy.shootTimer!++;
        const shootInterval = enemy.phase === 'rage' ? 84 : 120;
        if (enemy.shootTimer! >= shootInterval) {
          // 3-way spread
          const baseAngle = Math.atan2(dy, dx);
          for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + (i * Math.PI / 6);
            projectilesRef.current.push({
              id: Math.random().toString(),
              pos: { ...enemy.pos },
              vel: { x: Math.cos(angle) * 3.5, y: Math.sin(angle) * 3.5 },
              damage: 15,
              radius: 10,
              type: WeaponType.FIREBALL,
              pierce: 0,
              lifeTime: 150,
              color: '#d500f9',
            });
          }
          enemy.shootTimer = 0;

          // Summon minions if < 50%
          if (enemy.hp < enemy.maxHp * 0.5 && Math.random() > 0.5) {
            for (let i = 0; i < 2; i++) {
              const spawnAngle = Math.random() * Math.PI * 2;
              enemiesRef.current.push({
                id: Math.random().toString(),
                pos: { x: enemy.pos.x + Math.cos(spawnAngle) * 200, y: enemy.pos.y + Math.sin(spawnAngle) * 200 },
                radius: 15,
                hp: 30,
                maxHp: 30,
                speed: 2.0,
                damage: 10,
                xpValue: 0,
                type: 'TRIANGLE',
                color: '#d32f2f',
              });
            }
          }
        }
      } else {
        // Flanking for TRIANGLE
        if (enemy.type === 'TRIANGLE') {
          const angle = Math.atan2(dy, dx);
          const offset = Math.sin(Date.now() / 1000 + enemy.id.length) * 0.5;
          enemy.pos.x += Math.cos(angle + offset) * moveSpeed;
          enemy.pos.y += Math.sin(angle + offset) * moveSpeed;
        } else {
          enemy.pos.x += (dx / dist) * moveSpeed;
          enemy.pos.y += (dy / dist) * moveSpeed;
        }
      }

      if (dist < player.radius + enemy.radius) {
        if (player.shieldActive) {
          player.shieldActive = false;
          setLastShieldTime(now);
          // Small knockback or invincibility frame could go here
        } else {
          player.hp -= enemy.damage / 60;
          if (Math.random() < 0.1) audioService.playHit();
          player.noDamageTimer = 0; // Reset Time Traveler unlock check
          if (player.hp <= 0) setGameState('REVIVE');
        }
      }
    });

    // Projectiles
    projectilesRef.current = projectilesRef.current.filter(p => {
      if (p.type === WeaponType.HOMING) {
        let target: Enemy | null = null;
        let minDist = Infinity;
        enemiesRef.current.forEach(e => {
          const d = Math.sqrt((e.pos.x - p.pos.x)**2 + (e.pos.y - p.pos.y)**2);
          if (d < minDist) { minDist = d; target = e; }
        });
        if (target) {
          const dx = target.pos.x - p.pos.x;
          const dy = target.pos.y - p.pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          p.vel.x = (dx / d) * 5;
          p.vel.y = (dy / d) * 5;
        }
      }

      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.lifeTime--;

      let hit = false;
      enemiesRef.current.forEach(e => {
        const dx = e.pos.x - p.pos.x;
        const dy = e.pos.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < e.radius + p.radius) {
          if (p.type !== WeaponType.BOMB) {
            if (!e.shieldedBy) {
              e.hp -= p.damage;
            }
            if (p.type === WeaponType.FIREBALL && p.explosionRadius) {
              audioService.playExplosion();
              enemiesRef.current.forEach(e2 => {
                const d2 = Math.sqrt((e2.pos.x - p.pos.x)**2 + (e2.pos.y - p.pos.y)**2);
                if (d2 < p.explosionRadius) {
                  if (!e2.shieldedBy) {
                    e2.hp -= p.damage * 0.5;
                  }
                }
              });
            }
            p.pierce--;
            if (p.pierce < 0) hit = true;
          }
        }
      });

      if (p.type === WeaponType.BOMB && p.lifeTime <= 0) {
        // Explode
        audioService.playExplosion();
        enemiesRef.current.forEach(e => {
          const d = Math.sqrt((e.pos.x - p.pos.x)**2 + (e.pos.y - p.pos.y)**2);
          if (d < p.explosionRadius!) {
            if (!e.shieldedBy) {
              e.hp -= p.damage;
            }
          }
        });
        
        const bombSkill = player.skills.find(s => s.id === 'bomb');
        if (bombSkill && bombSkill.level >= 5) {
          // Split
          for (let i = 0; i < 3; i++) {
            projectilesRef.current.push({
              id: Math.random().toString(),
              pos: { ...p.pos },
              vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
              damage: 15,
              radius: 6,
              type: WeaponType.FIREBALL,
              pierce: 0,
              lifeTime: 30,
              color: '#18181b',
              explosionRadius: 60,
            });
          }
        }
        return false;
      }

      return p.lifeTime > 0 && !hit;
    });

    // Enemy Death & XP
    enemiesRef.current = enemiesRef.current.filter(e => {
      if (e.hp <= 0) {
        audioService.playExplosion();
        // Level Unlock Logic
        if (e.type === 'BOSS') {
          if (currentLevelId === 'city' && !unlockedLevelIds.includes('neon')) {
            setUnlockedLevelIds(prev => [...prev, 'neon']);
          } else if (currentLevelId === 'neon' && !unlockedLevelIds.includes('volcano')) {
            setUnlockedLevelIds(prev => [...prev, 'volcano']);
          } else if (currentLevelId === 'volcano' && !unlockedLevelIds.includes('void')) {
            setUnlockedLevelIds(prev => [...prev, 'void']);
          } else if (currentLevelId === 'void' && !unlockedLevelIds.includes('boss_rush')) {
            setUnlockedLevelIds(prev => [...prev, 'boss_rush']);
          }
        }

        // EXPERIMENT Splitting
        if (e.type === 'EXPERIMENT' && !e.isSmall) {
          for (let i = 0; i < 2; i++) {
            enemiesRef.current.push({
              ...e,
              id: Math.random().toString(36),
              hp: 20,
              maxHp: 20,
              radius: 12,
              isSmall: true,
              pos: { x: e.pos.x + (Math.random() - 0.5) * 20, y: e.pos.y + (Math.random() - 0.5) * 20 }
            });
          }
        }

        if (player.characterId === 'shadow') {
          player.speedBoostTimer = 30; // 0.5s
          const char = CHARACTERS.find(c => c.id === 'shadow')!;
          player.speed = 4 * char.stats.speed * 1.3;
        }
        // Mage fireball kill check (approximate, since we don't track which projectile killed)
        // We can check if the player is mage and fireball is active
        if (player.characterId === 'mage' && player.skills.some(s => s.type === WeaponType.FIREBALL)) {
          player.fireballKills = (player.fireballKills || 0) + 1;
          if (player.fireballKills >= 50 && !unlockedCharacterIds.includes('mage')) {
            setUnlockedCharacterIds(prev => [...prev, 'mage']);
            setUnlockData({ name: '焰灵', attr: '双倍升级' });
          }
        }

        if (e.type === 'BOSS') {
          setBossKilled(true);
          setGameState('VICTORY');
          setVictoryTime(Date.now());
          // Purple circular explosion
          for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            particlesRef.current.push({
              x: e.pos.x,
              y: e.pos.y,
              vx: Math.cos(angle) * 8,
              vy: Math.sin(angle) * 8,
              life: 60,
              color: '#7b1fa2',
              size: 10
            });
          }
        }
        if (e.isElite) {
          // Golden particle explosion
          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particlesRef.current.push({
              x: e.pos.x,
              y: e.pos.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 40,
              color: '#ffd700',
              size: 5
            });
          }
          for (let i = 0; i < 5; i++) {
            xpGemsRef.current.push({
              id: Math.random().toString(),
              pos: { x: e.pos.x + (Math.random() - 0.5) * 40, y: e.pos.y + (Math.random() - 0.5) * 40 },
              value: 30,
              color: '#fbc02d',
            });
          }
          // Drop clear item
          setGameItems(prev => [...prev, {
            id: Math.random().toString(),
            type: 'CLEAR',
            pos: { ...e.pos },
            radius: 20,
            rotation: 0
          }]);
        } else if (e.xpValue > 0) {
          xpGemsRef.current.push({
            id: Math.random().toString(),
            pos: { ...e.pos },
            value: e.xpValue,
            color: '#4ade80',
          });
        }
        
        if (!firstKillDone.current) {
          firstKillDone.current = true;
          setTutorialHint({ text: '自动攻击最近敌人', life: 120 });
        }
        
        setTotalKills(k => k + 1);
        setTotalKillsEver(k => {
          const next = k + 1;
          if (next >= 1000 && !unlockedCharacterIds.includes('mechanic')) {
            setUnlockedCharacterIds(prev => [...prev, 'mechanic']);
            setUnlockData({ name: '铁心', attr: '自动护盾' });
          }
          return next;
        });
        if (totalKills + 1 >= 300 && !unlockedCharacterIds.includes('berserker')) {
          setUnlockedCharacterIds(prev => [...prev, 'berserker']);
          setUnlockData({ name: '怒爪', attr: '血性狂暴' });
        }
        setScore(s => s + 10);
        return false;
      }
      return true;
    });

    // XP Gems
    const hasExpMagnet = player.skills.some(s => s.id === 'exp_magnet');
    xpGemsRef.current = xpGemsRef.current.filter(gem => {
      const dx = player.pos.x - gem.pos.x;
      const dy = player.pos.y - gem.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (hasExpMagnet || dist < player.magnetRange) {
        const speed = hasExpMagnet ? 10 : 8;
        gem.pos.x += (dx / dist) * speed;
        gem.pos.y += (dy / dist) * speed;
      }

      if (dist < player.radius + 10) {
        audioService.playCollect();
        player.xp += gem.value;
        setKillHints(prev => [...prev, { id: Math.random().toString(), text: `+${gem.value}`, x: player.pos.x, y: player.pos.y - 20, life: 60 }]);
        if (player.xp >= player.xpToNextLevel) {
          audioService.playLevelUp();
          player.xp -= player.xpToNextLevel;
          player.level++;
          
          // XP Requirement adjustments: Increase by 30 for each level (tuned to reach ~half max levels by boss)
          player.xpToNextLevel = 50 + (player.level - 1) * 30;
          
          const hasDoubleUpgrade = player.skills.some(s => s.id === 'double_upgrade');
          const optionCount = hasDoubleUpgrade ? 4 : 3;
          
          const options = SKILLS.filter(s => {
            const existing = player.skills.find(ps => ps.id === s.id);
            return !existing || existing.level < s.maxLevel;
          }).sort(() => 0.5 - Math.random()).slice(0, optionCount);
          
          setLevelUpOptions(options);
          setGameState('LEVEL_UP');
        }
        return false;
      }
      return true;
    });

    // Spawning logic
    phase = getCurrentPhase(timer);
    let spawnInterval = 1200; // Faster base spawn rate
    if (phase === 'buildup') {
      spawnInterval = Math.max(600, 1200 - (timer / 1000 - 30) * 20);
    } else if (phase === 'climax') {
      spawnInterval = 400;
    } else if (phase === 'boss') {
      spawnInterval = Infinity;
    }

    if (timer - lastSpawnTime.current > spawnInterval && phase !== 'boss') {
      spawnEnemy();
      lastSpawnTime.current = timer;
    }

    // Special Events
    if (Math.floor(timer / 1000) === 60 && !enemiesRef.current.some(e => e.isElite)) {
      spawnEnemy('STAR');
    }
    if (Math.floor(timer / 1000) === 120 && gameItems.length === 0) {
      setGameItems([{ id: 'clear', pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 }, type: 'CLEAR', radius: 30, rotation: 0 }]);
    }
    const level = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
    const bossSpawnTime = level.duration - 30;
    if (Math.floor(timer / 1000) === bossSpawnTime && !enemiesRef.current.some(e => e.type === 'BOSS') && !bossKilled) {
      spawnEnemy('BOSS');
    }

    // Items
    setGameItems(prev => prev.filter(item => {
      const dx = player.pos.x - item.pos.x;
      const dy = player.pos.y - item.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.radius + item.radius) {
        if (item.type === 'CLEAR') {
          enemiesRef.current.forEach(e => {
            if (e.type !== 'BOSS' && !e.isElite) e.hp = 0;
          });
          // White shockwave would be in draw
        }
        return false;
      }
      item.rotation += 0.05;
      return true;
    }));

    if (level.duration > 0 && timer >= level.duration * 1000) {
      setGameState('VICTORY');
      if (!unlockedCharacterIds.includes('shadow')) {
        setUnlockedCharacterIds(prev => [...prev, 'shadow']);
        setUnlockData({ name: '夜影', attr: '连杀加速' });
      }
    }

    if (tutorialHint) {
      setTutorialHint(prev => prev ? { ...prev, life: prev.life - 1 } : null);
      if (tutorialHint.life <= 0) setTutorialHint(null);
    }

    setTimer(t => t + 16);
  }, [gameState, spawnEnemy, timer, tutorialHint, gameItems, bossKilled, mousePos, currentLevelId]);

function drawGear(ctx: CanvasRenderingContext2D, cx: number, cy: number, teeth: number, rotation: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  for (let i = 0; i < teeth; i++) {
    ctx.rotate((Math.PI * 2) / teeth);
    ctx.fillRect(-2, -12, 4, 6);
  }
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCharacterAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, charId: string, size: number) {
  const char = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];
  const r = size / 8;
  
  // Background
  drawRoundRect(ctx, x - size/2, y - size/2, size, size, r, char.color);
  
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 100;
  ctx.scale(scale, scale);
  
  if (charId === 'survivor') {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(15, 15); ctx.lineTo(35, 15); ctx.stroke();
  } else if (charId === 'shadow') {
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.fillStyle = '#e040fb';
    ctx.beginPath(); ctx.arc(-5, -12, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -12, 3, 0, Math.PI*2); ctx.fill();
  } else if (charId === 'mechanic') {
    ctx.fillStyle = '#ff9800';
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -35); ctx.stroke();
  } else if (charId === 'mage') {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.moveTo(-15, -25); ctx.lineTo(0, -45); ctx.lineTo(15, -25);
    ctx.lineTo(10, -35); ctx.lineTo(0, -25); ctx.lineTo(-10, -35);
    ctx.fill();
  } else if (charId === 'time') {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.stroke();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.strokeStyle = '#00bcd4';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(10, -10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -20); ctx.stroke();
  } else if (charId === 'berserker') {
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillRect(-15, 5, 30, 30);
    ctx.strokeStyle = 'white';
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(40, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-40, -20); ctx.stroke();
  }
  
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  const char = CHARACTERS.find(c => c.id === player.characterId) || CHARACTERS[0];
  const { x, y } = player.pos;

  // Character Specific Decor
  if (player.characterId === 'shadow') {
    for (let i = 1; i <= 3; i++) {
      ctx.globalAlpha = 0.3 - i * 0.1;
      ctx.beginPath();
      ctx.arc(x - (player.speedBoostTimer! > 0 ? 20 : 0) * i * 0.2, y, 20 - i * 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4a148c';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (player.characterId === 'mechanic') {
    const gearAngle = Date.now() / 500;
    drawGear(ctx, x - 25, y, 8, gearAngle, '#ff9800');
    drawGear(ctx, x + 25, y, 6, -gearAngle * 1.5, '#ffc107');
    if (player.shieldActive) {
      ctx.strokeStyle = '#03a9f4';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI*2); ctx.stroke();
    }
  } else if (player.characterId === 'mage') {
    const flameHeight = 10 + Math.sin(Date.now() / 100) * 5;
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(x - 15, y - 25, 6, flameHeight);
    ctx.fillRect(x + 9, y - 25, 6, flameHeight);
  } else if (player.characterId === 'time') {
    const timeAngle = Date.now() / 1000;
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(timeAngle) * 15, y + Math.sin(timeAngle) * 15);
    ctx.stroke();
  } else if (player.characterId === 'berserker') {
    if (player.hp < player.maxHp) {
      const rageLevel = 1 - player.hp / player.maxHp;
      for (let i = 0; i < rageLevel * 10; i++) {
        const rx = x + (Math.random() - 0.5) * 50;
        const ry = y + (Math.random() - 0.5) * 50;
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(rx, ry, 3, 3);
      }
    }
  }

  // Base Body
  ctx.beginPath();
  ctx.arc(x, y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = char.color;
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Health Bar
  const barW = 40;
  const barH = 6;
  const bx = x - barW / 2;
  const by = y - 35;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(bx, by, barW * (player.hp / player.maxHp), barH);
}

  const drawAchievements = (ctx: CanvasRenderingContext2D, unlockedIds: string[], hoveredIdx: number | null) => {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', GAME_WIDTH / 2, 80);

    ACHIEVEMENTS.forEach((ach, i) => {
      const isUnlocked = unlockedIds.includes(ach.id);
      const x = 50;
      const y = 150 + i * 120;
      const w = GAME_WIDTH - 100;
      const h = 100;

      drawRoundRect(ctx, x, y, w, h, 15, isUnlocked ? '#1e293b' : '#111', isUnlocked ? '#4f46e5' : '#333');
      
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ach.icon, x + 20, y + 65);

      ctx.fillStyle = isUnlocked ? 'white' : '#666';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(ach.name, x + 100, y + 40);

      ctx.fillStyle = isUnlocked ? '#ccc' : '#444';
      ctx.font = '18px sans-serif';
      ctx.fillText(ach.description, x + 100, y + 75);

      if (isUnlocked) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('已达成', x + w - 20, y + 55);
      }
    });

    // Back Button
    const btnW = 200;
    const btnH = 60;
    const btnX = (GAME_WIDTH - btnW) / 2;
    const btnY = GAME_HEIGHT - 100;
    const isHovered = hoveredIdx === 1002;
    drawRoundRect(ctx, btnX, btnY, btnW, btnH, 30, isHovered ? '#333' : '#222', 'white');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('返回', GAME_WIDTH / 2, btnY + 38);
  };

  const drawBoss = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const { x, y } = enemy.pos;
    const radius = enemy.radius;
    const color = enemy.phase === 'rage' ? '#d500f9' : '#7b1fa2';
    
    // Glow
    const glowRadius = radius + 10 + Math.sin(Date.now() / 200) * 5;
    drawGlow(ctx, x, y, glowRadius, color, 0.4);
    
    // Body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Eyes
    const player = playerRef.current;
    const angle = Math.atan2(player.pos.y - y, player.pos.x - x);
    const eyeX = x + Math.cos(angle) * 30;
    const eyeY = y + Math.sin(angle) * 30;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#ff1744';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeX + 5, eyeY - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // HP Bar
    const barWidth = 160;
    const barHeight = 12;
    const barX = x - barWidth / 2;
    const barY = y - radius - 30;
    
    drawRoundRect(ctx, barX, barY, barWidth, barHeight, 6, '#37474f');
    const hpPercent = enemy.hp / enemy.maxHp;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * hpPercent, 0);
    gradient.addColorStop(0, '#7b1fa2');
    gradient.addColorStop(1, '#e1bee7');
    drawRoundRect(ctx, barX, barY, barWidth * hpPercent, barHeight, 6, gradient);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(enemy.hp)}/${enemy.maxHp}`, x, barY - 8);

    // Rage particles
    if (enemy.phase === 'rage') {
      for (let i = 0; i < 4; i++) {
        const pAngle = (Date.now() / 300) + (i * Math.PI / 2);
        const px = x + Math.cos(pAngle) * 120;
        const py = y + Math.sin(pAngle) * 120;
        ctx.fillStyle = '#d500f9';
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  const drawTimer = (ctx: CanvasRenderingContext2D, remainingSeconds: number) => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const isUrgent = remainingSeconds <= 30;
    const bgColor = isUrgent ? 'rgba(183,28,28,0.8)' : 'rgba(0,0,0,0.6)';
    const textColor = isUrgent ? '#ff1744' : '#fff';
    
    ctx.font = 'bold 32px monospace';
    const textWidth = ctx.measureText(text).width;
    const padding = 15;
    
    drawRoundRect(ctx, GAME_WIDTH / 2 - textWidth / 2 - padding, 25, textWidth + padding * 2, 50, 12, bgColor);
    
    if (isUrgent && Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, GAME_WIDTH / 2, 50);
    ctx.globalAlpha = 1;
    
    if (remainingSeconds <= 10) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#ff1744';
      ctx.fillText('!', GAME_WIDTH / 2 + textWidth / 2 + 25, 50);
    }
    ctx.textBaseline = 'alphabetic';
  };

  const drawCharacterSelect = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择角色', GAME_WIDTH / 2, 80);

    const cardW = 320;
    const cardH = 220;
    const gap = 30;
    const startY = 150;

    CHARACTERS.forEach((char, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = (GAME_WIDTH - (cardW * 2 + gap)) / 2 + col * (cardW + gap);
      const y = startY + row * (cardH + gap);

      const isUnlocked = unlockedCharacterIds.includes(char.id);
      const isSelected = selectedCharacterId === char.id;
      const isHovered = hoveredIndex === i;

      // Card Background
      ctx.save();
      if (isHovered) {
        ctx.translate(x + cardW/2, y + cardH/2);
        ctx.scale(1.05, 1.05);
        ctx.translate(-(x + cardW/2), -(y + cardH/2));
      }
      
      drawRoundRect(ctx, x, y, cardW, cardH, 16, '#263238', isSelected ? '#ffd700' : (isHovered ? 'white' : 'rgba(255,255,255,0.1)'));
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Avatar
      drawCharacterAvatar(ctx, x + 60, y + 60, char.id, 80);

      // Info
      ctx.textAlign = 'left';
      ctx.fillStyle = isUnlocked ? 'white' : '#999';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(char.name, x + 120, y + 50);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ccc';
      const descLines = char.description.match(/.{1,12}/g) || [];
      descLines.forEach((line, li) => {
        ctx.fillText(line, x + 120, y + 80 + li * 20);
      });

      // Stats
      ctx.font = '12px sans-serif';
      const statsY = y + 140;
      const speedDiff = Math.round((char.stats.speed - 1) * 100);
      const hpDiff = Math.round((char.stats.hp / 100 - 1) * 100);
      ctx.fillStyle = speedDiff >= 0 ? '#4caf50' : '#f44336';
      ctx.fillText(`移速: ${speedDiff >= 0 ? '+' : ''}${speedDiff}%`, x + 20, statsY);
      ctx.fillStyle = hpDiff >= 0 ? '#4caf50' : '#f44336';
      ctx.fillText(`血量: ${hpDiff >= 0 ? '+' : ''}${hpDiff}%`, x + 120, statsY);

      // Special
      ctx.fillStyle = '#ffd700';
      ctx.font = 'italic 12px sans-serif';
      ctx.fillText(char.specialDescription, x + 20, statsY + 25);

      // Unlock Status / Button
      if (isUnlocked) {
        const btnW = 100;
        const btnH = 36;
        const bx = x + cardW - btnW - 15;
        const by = y + cardH - btnH - 15;
        const isBtnHovered = hoveredIndex === i;
        drawRoundRect(ctx, bx, by, btnW, btnH, 18, isSelected ? '#4caf50' : 'white');
        ctx.fillStyle = isSelected ? 'white' : 'black';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isSelected ? '已选择' : '选择', bx + btnW/2, by + 24);
      } else {
        ctx.fillStyle = '#f44336';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(char.unlockCondition, x + cardW - 15, y + cardH - 20);
      }

      ctx.restore();
    });

    // Back Button
    const backW = 200;
    const backH = 60;
    const backX = (GAME_WIDTH - backW) / 2;
    const backY = GAME_HEIGHT - 100;
    const isBackHovered = hoveredIndex === 100;
    drawRoundRect(ctx, backX, backY, backW, backH, 30, isBackHovered ? '#333' : 'rgba(255,255,255,0.1)', 'white');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('返回主页', GAME_WIDTH / 2, backY + 38);
  };

  const draw = useCallback(() => {
    const canvas = (typeof wx !== 'undefined' ? (window as any).canvas : canvasRef.current) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameState === 'CHARACTER_SELECT') {
      drawCharacterSelect(ctx);
      return;
    }

    if (gameState === 'ACHIEVEMENTS') {
      drawAchievements(ctx, unlockedAchievements, hoveredIndex);
      return;
    }

    if (gameState === 'LEVEL_SELECT') {
      drawLevelSelect(ctx, selectedLevelId, unlockedLevelIds, hoveredIndex, mousePos);
      return;
    }

    if (gameState === 'LEVEL_UP') {
      drawLevelUp(ctx, levelUpOptions, hoveredIndex);
      return;
    }

    if (gameState === 'GAME_OVER') {
      drawGameOver(ctx, score, formatTime(timer));
      return;
    }

    if (gameState === 'PAUSED') {
      drawPauseMenu(ctx, hoveredIndex);
      return;
    }

    if (gameState === 'START') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('几何战士', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150);
      
      // Mini Program Ready Badge
      ctx.fillStyle = '#07c160'; // WeChat Green
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('微信小程序版已就绪', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
      
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('极简主义 Roguelike', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);

      // Start Button
      const startW = 240;
      const startH = 70;
      const startX = (GAME_WIDTH - startW) / 2;
      const startY = GAME_HEIGHT / 2 - 20;
      const isStartHovered = hoveredIndex === 10;
      drawRoundRect(ctx, startX, startY, startW, startH, 35, isStartHovered ? '#4338ca' : '#6366f1', 'white');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('开始游戏', GAME_WIDTH / 2, startY + 45);

      // Character Select Button
      const charW = 240;
      const charH = 70;
      const charX = (GAME_WIDTH - charW) / 2;
      const charY = GAME_HEIGHT / 2 + 80;
      const isCharHovered = hoveredIndex === 11;
      drawRoundRect(ctx, charX, charY, charW, charH, 35, isCharHovered ? '#1e293b' : 'rgba(255,255,255,0.1)', 'white');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('选择角色', GAME_WIDTH / 2, charY + 45);

      // Level Select Button
      const lvlW = 240;
      const lvlH = 70;
      const lvlX = (GAME_WIDTH - lvlW) / 2;
      const lvlY = GAME_HEIGHT / 2 + 180;
      const isLvlHovered = hoveredIndex === 12;
      drawRoundRect(ctx, lvlX, lvlY, lvlW, lvlH, 35, isLvlHovered ? '#1e293b' : 'rgba(255,255,255,0.1)', 'white');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('选择关卡', GAME_WIDTH / 2, lvlY + 45);

      // Achievements Button
      const achW = 240;
      const achH = 70;
      const achX = (GAME_WIDTH - achW) / 2;
      const achY = GAME_HEIGHT / 2 + 280;
      const isAchHovered = hoveredIndex === 13;
      drawRoundRect(ctx, achX, achY, achW, achH, 35, isAchHovered ? '#1e293b' : 'rgba(255,255,255,0.1)', 'white');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('成就系统', GAME_WIDTH / 2, achY + 45);
      return;
    }

    const player = playerRef.current;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Level Background
    const level = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
    ctx.fillStyle = level.theme.bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Game Title (Watermark style)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('几何战士', GAME_WIDTH / 2, 120); // Moved from 40 to 120
    ctx.restore();

    // Draw Ground Elements
    if (currentLevelId === 'city') {
      ctx.strokeStyle = level.theme.groundColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < GAME_HEIGHT; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(GAME_WIDTH, i);
        ctx.stroke();
      }
      // Buildings
      ctx.fillStyle = level.theme.decorColor;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * 150 + 20, GAME_HEIGHT - 200 - (i % 3) * 50, 100, 400);
      }
    } else if (currentLevelId === 'neon') {
      const pulse = (Math.sin(Date.now() / 500) + 1) / 2;
      ctx.strokeStyle = `rgba(0, 188, 212, ${0.05 + pulse * 0.05})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < GAME_HEIGHT; i += 60) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(GAME_WIDTH, i);
        ctx.stroke();
      }
      // Laser beams (visual only)
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.1)';
      ctx.lineWidth = 4;
      [100, 300, 500, 700].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, GAME_HEIGHT);
        ctx.stroke();
      });
    } else if (currentLevelId === 'volcano') {
      // Lava cracks
      ctx.strokeStyle = `rgba(255, 87, 34, 0.4)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 100); ctx.lineTo(200, 300); ctx.lineTo(150, 500);
      ctx.stroke();
      // Lava
      drawLava(ctx, lavaHeight);
      // Platforms
      platforms.forEach(p => drawPlatform(ctx, p.x, p.y, p.radius));
    } else if (currentLevelId === 'void') {
      // Stars
      ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const opacity = (Math.sin(Date.now() / 1000 + i) + 1) / 2;
        ctx.globalAlpha = opacity;
        ctx.fillRect((i * 123) % GAME_WIDTH, (i * 456) % GAME_HEIGHT, 2, 2);
      }
      ctx.globalAlpha = 1;
      // Vortex
      drawVortex(ctx, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    } else if (currentLevelId === 'boss_rush') {
      // Checkerboard
      const size = 100;
      for (let i = 0; i < GAME_WIDTH; i += size) {
        for (let j = 0; j < GAME_HEIGHT; j += size) {
          ctx.fillStyle = (Math.floor(i / size) + Math.floor(j / size)) % 2 === 0 ? '#1a1a1a' : '#2a2a2a';
          ctx.fillRect(i, j, size, size);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(i, j, size, size);
        }
      }
    }

    // Draw Laser Traps
    laserTraps.forEach(trap => {
      const progress = trap.timer / (trap.state === 'warning' ? 60 : 180);
      drawLaser(ctx, trap.y, trap.state, progress);
    });

    // Ground Spikes
    groundSpikesRef.current.forEach(spike => {
      if (spike.state === 'WARNING') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(spike.pos.x, spike.pos.y, spike.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(spike.pos.x, spike.pos.y - 60);
        ctx.lineTo(spike.pos.x - 30, spike.pos.y + 20);
        ctx.lineTo(spike.pos.x + 30, spike.pos.y + 20);
        ctx.fill();
      }
    });

    xpGemsRef.current.forEach(gem => {
      const dx = player.pos.x - gem.pos.x;
      const dy = player.pos.y - gem.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 300) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gem.pos.x, gem.pos.y);
        ctx.lineTo(player.pos.x, player.pos.y);
        ctx.stroke();
      }

      drawGlow(ctx, gem.pos.x, gem.pos.y, 8, '#4ade80', 0.4 * (Math.sin(Date.now() / 200) * 0.5 + 0.5));
      ctx.fillStyle = gem.color;
      ctx.beginPath();
      ctx.arc(gem.pos.x, gem.pos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(gem.pos.x, gem.pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    projectilesRef.current.forEach(p => {
      if (p.type === WeaponType.LIGHTNING) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(player.pos.x, player.pos.y);
        const segments = 6;
        for (let i = 1; i <= segments; i++) {
          const tx = player.pos.x + (p.pos.x - player.pos.x) * (i / segments) + (Math.random() - 0.5) * 30;
          const ty = player.pos.y + (p.pos.y - player.pos.y) * (i / segments) + (Math.random() - 0.5) * 30;
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add a flash at the target
        drawGlow(ctx, p.pos.x, p.pos.y, 40, '#00ffff', p.lifeTime / 20);
        return;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === WeaponType.HOMING) {
        // Trail
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.translate(p.pos.x - p.vel.x * 2, p.pos.y - p.vel.y * 2);
        ctx.rotate(Math.atan2(p.vel.y, p.vel.x) + Math.PI / 4);
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();

        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(Math.atan2(p.vel.y, p.vel.x) + Math.PI / 4);
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      } else {
        ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    // Rotating Swords
    const swordSkill = player.skills.find(s => s.id === 'sword');
    if (swordSkill) {
      const swordCount = swordSkill.level >= 2 ? 3 : 2;
      const swordHeight = swordSkill.level >= 5 ? 60 : 40;
      const swordRadius = 60;
      for (let i = 0; i < swordCount; i++) {
        const angle = swordAngle.current + (i * Math.PI * 2) / swordCount;
        const sx = player.pos.x + Math.cos(angle) * swordRadius;
        const sy = player.pos.y + Math.sin(angle) * swordRadius;
        
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle + Math.PI / 2);

        // Trail for Sword
        if (swordSkill.level >= 5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, -swordHeight/2);
          ctx.lineTo(15, -swordHeight/2 + 10);
          ctx.lineTo(0, swordHeight/2);
          ctx.fill();
        }

        ctx.fillStyle = 'white';
        ctx.fillRect(-5, -swordHeight / 2, 10, swordHeight);
        ctx.restore();
      }
    }

    enemiesRef.current.forEach(e => {
      if (e.type === 'BOSS') {
        drawBoss(ctx, e);
        return;
      }
      ctx.fillStyle = e.color;
      ctx.beginPath();
      if (e.type === 'TRIANGLE') {
        ctx.moveTo(e.pos.x, e.pos.y - e.radius);
        ctx.lineTo(e.pos.x - e.radius, e.pos.y + e.radius);
        ctx.lineTo(e.pos.x + e.radius, e.pos.y + e.radius);
      } else if (e.type === 'DIAMOND') {
        ctx.save();
        ctx.translate(e.pos.x, e.pos.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        ctx.restore();
      } else if (e.type === 'CIRCLE') {
        ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      } else if (e.type === 'STAR') {
        drawPolygon(ctx, e.pos.x, e.pos.y, e.radius, 5, e.color, Date.now() / 1000);
      } else if (e.type === 'SHIELD_GENERATOR') {
        drawPolygon(ctx, e.pos.x, e.pos.y, e.radius, 6, e.color, Date.now() / 1000);
        drawGlow(ctx, e.pos.x, e.pos.y, e.radius * 2, 'rgba(0, 188, 212, 0.2)', 0.5);
      } else if (e.type === 'CHARGER') {
        const rotation = e.isCharging ? Date.now() / 100 : 0;
        drawPolygon(ctx, e.pos.x, e.pos.y, e.radius, 3, e.isCharging ? '#ff1744' : e.color, rotation);
      } else if (e.type === 'COMMANDER') {
        drawPolygon(ctx, e.pos.x, e.pos.y, e.radius, 8, e.color, Date.now() / 2000);
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, 70, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.rect(e.pos.x - e.radius, e.pos.y - e.radius, e.radius * 2, e.radius * 2);
      }
      ctx.closePath();
      ctx.fill();

      if (e.shieldedBy) {
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, e.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      if (e.type !== 'BOSS') {
        ctx.fillStyle = '#333';
        ctx.fillRect(e.pos.x - 15, e.pos.y - e.radius - 10, 30, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.pos.x - 15, e.pos.y - e.radius - 10, (e.hp / e.maxHp) * 30, 4);
      }
    });

    // Items
    gameItems.forEach(item => {
      if (item.type === 'CLEAR') {
        ctx.save();
        ctx.translate(item.pos.x, item.pos.y);
        ctx.rotate(item.rotation);
        drawPolygon(ctx, 0, 0, item.radius, 5, '#ffd700');
        drawGlow(ctx, 0, 0, item.radius, '#ffd700', 0.5);
        ctx.restore();
      }
    });

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, player.attackRange, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Joystick on top if playing
    if (gameState === 'PLAYING' && joystickBase && joystickStick) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(joystickBase.x, joystickBase.y, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(joystickStick.x, joystickStick.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.restore();
    }

    drawPlayer(ctx, player);

    // UI: Top Bar (Simplified)
    drawTopBar(ctx, timer, score, player, menuBtnState, isMuted);

    // Achievement Notification
    if (achievementNotification) {
      const notifW = 300;
      const notifH = 60;
      const notifX = (GAME_WIDTH - notifW) / 2;
      const notifY = 100;
      drawRoundRect(ctx, notifX, notifY, notifW, notifH, 30, '#4f46e5', 'white');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🏆 获得成就: ${achievementNotification}`, GAME_WIDTH / 2, notifY + 38);
    }

    // UI: Tutorial Hints
    if (tutorialHint) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, tutorialHint.life / 30);
      ctx.fillText(tutorialHint.text, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
      ctx.restore();
    }

    // UI: Kill Hints
    killHints.forEach(h => {
      ctx.save();
      ctx.globalAlpha = h.life / 60;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(h.text, h.x, h.y);
      ctx.restore();
    });

    // UI: XP Bar
    const xpBarW = GAME_WIDTH - 100;
    const xpBarH = 12;
    const xpBarX = 50;
    const xpBarY = 80;
    drawRoundRect(ctx, xpBarX, xpBarY, xpBarW, xpBarH, 6, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)');
    const xpProgress = player.xp / player.xpToNextLevel;
    if (xpProgress > 0) {
      drawRoundRect(ctx, xpBarX, xpBarY, xpBarW * xpProgress, xpBarH, 6, '#6366f1');
    }
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LV ${player.level}`, xpBarX + xpBarW, xpBarY + 30);

    // UI: Character Skill Button
    if (player.characterId === 'time') {
      const btnSize = 80;
      const bx = GAME_WIDTH - 120;
      const by = GAME_HEIGHT - 120;
      const now = Date.now();
      const cooldownRemaining = Math.max(0, (player.lastSkillTime || 0) + (player.skillCooldown || 0) - now);
      const isReady = cooldownRemaining === 0;
      
      ctx.save();
      ctx.globalAlpha = isReady ? 1 : 0.5;
      drawRoundRect(ctx, bx, by, btnSize, btnSize, 15, '#6366f1', isReady ? 'white' : 'rgba(255,255,255,0.3)');
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('时停', bx + btnSize/2, by + btnSize/2 + 6);
      
      if (!isReady) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        const progress = cooldownRemaining / (player.skillCooldown || 15000);
        ctx.beginPath();
        ctx.moveTo(bx + btnSize/2, by + btnSize/2);
        ctx.arc(bx + btnSize/2, by + btnSize/2, btnSize/2, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${Math.ceil(cooldownRemaining/1000)}s`, bx + btnSize/2, by + btnSize/2 + 25);
      }
      ctx.restore();
    }

    // Menus
    if (gameState === 'REVIVE' || gameState === 'VICTORY' || gameState === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      const menuW = 500;
      const menuH = 500;
      const mx = (GAME_WIDTH - menuW) / 2;
      const my = (GAME_HEIGHT - menuH) / 2;
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      const title = gameState === 'VICTORY' ? '生存成功！' : `你坚持了 ${formatTime(timer)}`;
      ctx.fillText(title, GAME_WIDTH / 2, my + 50);
      
      ctx.fillStyle = '#999';
      ctx.font = '18px sans-serif';
      ctx.fillText(`击杀 ${totalKills} | 金币 +${totalKills * 2 + (gameState === 'VICTORY' ? 100 : 0)}`, GAME_WIDTH / 2, my + 90);

      if (gameState === 'REVIVE') {
        const btnW = 400;
        const btnH = 70;
        const bx = (GAME_WIDTH - btnW) / 2;
        
        // Button A
        const ay = my + 150;
        const isHoverA = hoveredIndex === 10;
        drawRoundRect(ctx, bx, ay, btnW, btnH, 12, '#2e7d32', isHoverA ? 'white' : undefined);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('观看广告 满血继续', GAME_WIDTH / 2, ay + 30);
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '12px sans-serif';
        ctx.fillText('剩余1次', GAME_WIDTH / 2, ay + 50);

        // Button B
        const by = ay + 100;
        const isHoverB = hoveredIndex === 11;
        drawRoundRect(ctx, bx, by, btnW, btnH, 12, '#1565c0', isHoverB ? 'white' : undefined);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('分享群聊 获得护盾', GAME_WIDTH / 2, by + 30);
        ctx.fillStyle = '#90caf9';
        ctx.font = '12px sans-serif';
        ctx.fillText('10秒无敌保护', GAME_WIDTH / 2, by + 50);

        // Button C
        const cy = by + 100;
        const isHoverC = hoveredIndex === 12;
        drawRoundRect(ctx, bx, cy, btnW, btnH, 12, '#455a64', isHoverC ? 'white' : undefined);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('放弃并结算', GAME_WIDTH / 2, cy + 40);
      } else if (gameState === 'VICTORY') {
        const isShadowUnlocked = unlockedCharacterIds.includes('shadow') || isShadowWalkerUnlocked;
        if (!isShadowUnlocked) {
          // Unlock Card with Bounce Animation
          const elapsed = (Date.now() - victoryTime) / 1000;
          const bounce = (t: number) => {
            if (t < 0.5) return t * 2 * 1.1;
            if (t < 0.7) return 1.1 - (t - 0.5) * 0.5;
            return 1.0;
          };
          const scale = bounce(Math.min(1, elapsed));

          const cardW = 300;
          const cardH = 200;
          const cx = (GAME_WIDTH - cardW) / 2;
          const cy = my + 150;
          
          ctx.save();
          ctx.translate(cx + cardW/2, cy + cardH/2);
          ctx.scale(scale, scale);
          ctx.translate(-(cx + cardW/2), -(cy + cardH/2));

          drawRoundRect(ctx, cx, cy, cardW, cardH, 16, '#263238', '#ffd700');
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('解锁：暗影行者', cx + cardW/2, cy + 40);
          ctx.fillStyle = 'white';
          ctx.font = '16px sans-serif';
          ctx.fillText('+10% 基础移速', cx + cardW/2, cy + 80);
          
          const btnW = 120;
          const btnH = 50;
          const bx = cx + 20;
          const by = cy + 120;
          const isHoverU = hoveredIndex === 20;
          drawRoundRect(ctx, bx, by, btnW, btnH, 25, 'white', isHoverU ? '#ffd700' : undefined);
          ctx.fillStyle = 'black';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('立即试用', bx + btnW/2, by + 32);

          const backW = 120;
          const backH = 50;
          const backX = cx + cardW - backW - 20;
          const backY = cy + 120;
          const isHoverB = hoveredIndex === 21;
          drawRoundRect(ctx, backX, backY, backW, backH, 25, 'rgba(255,255,255,0.2)', isHoverB ? 'white' : undefined);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('返回菜单', backX + backW/2, backY + 32);
          ctx.restore();
        } else {
          const btnW = 200;
          const btnH = 50;
          const bx = (GAME_WIDTH - btnW) / 2;
          const by = my + 250;
          const isHovered = hoveredIndex === 21;
          drawRoundRect(ctx, bx, by, btnW, btnH, 25, isHovered ? 'white' : 'rgba(255,255,255,0.2)', isHovered ? undefined : 'white');
          ctx.fillStyle = isHovered ? 'black' : 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('返回主菜单', GAME_WIDTH / 2, by + 32);
        }
      } else if (gameState === 'GAME_OVER') {
        const btnW = 200;
        const btnH = 50;
        const bx = (GAME_WIDTH - btnW) / 2;
        const by = my + 250;
        const isHovered = hoveredIndex === 21;
        drawRoundRect(ctx, bx, by, btnW, btnH, 25, isHovered ? 'white' : 'rgba(255,255,255,0.2)', isHovered ? undefined : 'white');
        ctx.fillStyle = isHovered ? 'black' : 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('返回主菜单', GAME_WIDTH / 2, by + 32);
      }
    }

    // Level Up Menu (Canvas)
    if (gameState === 'LEVEL_UP') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('选择技能', GAME_WIDTH / 2, 120);

      const cardW = 220;
      const cardH = 300;
      const spacing = 20;
      const totalW = levelUpOptions.length <= 3 ? (cardW * levelUpOptions.length + spacing * (levelUpOptions.length - 1)) : (cardW * 2 + spacing);
      
      levelUpOptions.forEach((skill, i) => {
        let x, y;
        if (levelUpOptions.length <= 3) {
          x = (GAME_WIDTH - totalW) / 2 + i * (cardW + spacing);
          y = (GAME_HEIGHT - cardH) / 2;
        } else {
          // 2x2 grid
          const col = i % 2;
          const row = Math.floor(i / 2);
          x = (GAME_WIDTH - totalW) / 2 + col * (cardW + spacing);
          y = (GAME_HEIGHT - (cardH * 2 + spacing)) / 2 + row * (cardH + spacing);
        }

        const isHovered = hoveredIndex === i;
        const scale = isHovered ? 1.05 : 1.0;
        
        ctx.save();
        ctx.translate(x + cardW/2, y + cardH/2);
        ctx.scale(scale, scale);
        ctx.translate(-(x + cardW/2), -(y + cardH/2));

        drawRoundRect(ctx, x, y, cardW, cardH, 16, '#263238', isHovered ? '#ffd700' : undefined);
        
        if (isHovered) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          drawRoundRect(ctx, x, y, cardW, cardH, 16);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
        }

        // Icon
        drawSkillIcon(ctx, x + cardW/2, y + 80, skill, 100);

        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(skill.name, x + cardW/2, y + 160);

        const existing = player.skills.find(s => s.id === skill.id);
        const level = existing ? existing.level + 1 : 1;
        ctx.fillStyle = '#4caf50';
        ctx.font = '18px sans-serif';
        ctx.fillText(`Lv.${level}/${skill.maxLevel}`, x + cardW/2, y + 190);

        ctx.fillStyle = '#b0bec5';
        ctx.font = '16px sans-serif';
        const words = skill.description.split('');
        let line = '';
        let lines = 0;
        for(let n = 0; n < words.length; n++) {
          let testLine = line + words[n];
          let metrics = ctx.measureText(testLine);
          if (metrics.width > cardW - 40 && n > 0) {
            ctx.fillText(line, x + cardW/2, y + 230 + lines * 20);
            line = words[n];
            lines++;
          } else {
            line = testLine;
          }
          if (lines >= 2) break;
        }
        ctx.fillText(line, x + cardW/2, y + 230 + lines * 20);

        if (level < skill.maxLevel) {
          ctx.fillStyle = '#ffd700';
          ctx.font = 'italic 14px sans-serif';
          ctx.fillText(`下一级: ${skill.nextLevelPreview}`, x + cardW/2, y + 280);
        }

        ctx.restore();
      });
    }
    if (gameState === 'PAUSED') {
      drawPauseMenu(ctx, hoveredIndex);
    }
  }, [gameState, currentLevelId, lavaHeight, platforms, laserTraps, gameItems, tutorialHint, killHints, score, timer, totalKills, isShadowWalkerUnlocked, victoryTime, levelUpOptions, hoveredIndex, mousePos, menuBtnState]);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update, draw]);

  const handleSkillSelect = (skill: Skill) => {
    const player = playerRef.current;
    const existing = player.skills.find(s => s.id === skill.id);
    
    const upgrade = (s: Skill) => {
      const target = player.skills.find(ps => ps.id === s.id);
      if (target) {
        if (target.level < s.maxLevel) {
          target.level++;
          if (s.type === PassiveType.SPEED) player.speed *= 1.2;
          if (s.type === PassiveType.RANGE) player.attackRange *= 1.3;
          if (s.type === PassiveType.HEAL) player.regenRate += 0.05;
          if (s.type === PassiveType.MAGNET) player.magnetRange *= 1.5;
        }
      } else {
        player.skills.push({ ...s, level: 1 });
      }
    };

    upgrade(skill);
    
    // Mage special: 20% chance for double upgrade
    if (player.characterId === 'mage' && Math.random() < 0.2) {
      upgrade(skill);
      setTutorialHint({ text: '焰灵之力：双倍升级！', life: 120 });
    }

    setGameState('PLAYING');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = (typeof wx !== 'undefined' ? (window as any).canvas : canvasRef.current) as HTMLCanvasElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const scaleX = GAME_WIDTH / (rect.width || canvas.width);
    const scaleY = GAME_HEIGHT / (rect.height || canvas.height);
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    setMousePos({ x: mx, y: my });

    let found = null;
    if (gameState === 'START') {
      const startW = 240;
      const startH = 70;
      const startX = (GAME_WIDTH - startW) / 2;
      const startY = GAME_HEIGHT / 2 - 20;
      if (mx >= startX && mx <= startX + startW && my >= startY && my <= startY + startH) {
        found = 10 as any;
      } else {
        const charW = 240;
        const charH = 70;
        const charX = (GAME_WIDTH - charW) / 2;
        const charY = GAME_HEIGHT / 2 + 80;
        if (mx >= charX && mx <= charX + charW && my >= charY && my <= charY + charH) {
          found = 11 as any;
        } else {
          const lvlW = 240;
          const lvlH = 70;
          const lvlX = (GAME_WIDTH - lvlW) / 2;
          const lvlY = GAME_HEIGHT / 2 + 180;
          if (mx >= lvlX && mx <= lvlX + lvlW && my >= lvlY && my <= lvlY + lvlH) {
            found = 12 as any;
          } else {
            const achW = 240;
            const achH = 70;
            const achX = (GAME_WIDTH - achW) / 2;
            const achY = GAME_HEIGHT / 2 + 280;
            if (mx >= achX && mx <= achX + achW && my >= achY && my <= achY + achH) {
              found = 13 as any;
            }
          }
        }
      }
    } else if (gameState === 'ACHIEVEMENTS') {
      const btnW = 200;
      const btnH = 60;
      const btnX = (GAME_WIDTH - btnW) / 2;
      const btnY = GAME_HEIGHT - 100;
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        found = 1002 as any;
      }
    } else if (gameState === 'LEVEL_SELECT') {
      const listW = 250;
      if (mx < listW) {
        const index = Math.floor(my / 100);
        if (index >= 0 && index < LEVELS.length) found = index as any;
      } else {
        // Start Button
        const btnW = 250;
        const btnH = 80;
        const btnX = listW + (750 - listW - btnW) / 2;
        const btnY = 600;
        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
          found = 1000 as any;
        } else {
          // Back Button
          const backW = 150;
          const backH = 50;
          const backX = listW + (750 - listW - backW) / 2;
          const backY = 1334 - 100;
          if (mx >= backX && mx <= backX + backW && my >= backY && my <= backY + backH) {
            found = 1001 as any;
          }
        }
      }
    } else if (gameState === 'CHARACTER_SELECT') {
      const cardW = 320;
      const cardH = 220;
      const gap = 30;
      const startY = 150;

      CHARACTERS.forEach((char, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const cx = (GAME_WIDTH - (cardW * 2 + gap)) / 2 + col * (cardW + gap);
        const cy = startY + row * (cardH + gap);

        if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
          found = i as any;
        }
      });

      if (found === null) {
        const backW = 200;
        const backH = 60;
        const backX = (GAME_WIDTH - backW) / 2;
        const backY = GAME_HEIGHT - 100;
        if (mx >= backX && mx <= backX + backW && my >= backY && my <= backY + backH) {
          found = 100 as any;
        }
      }
    } else if (gameState === 'LEVEL_UP') {
      const cardW = 280;
      const cardH = 340;
      const spacing = 40;
      const totalW = levelUpOptions.length <= 3 ? (cardW * levelUpOptions.length + spacing * (levelUpOptions.length - 1)) : (cardW * 2 + spacing);
      
      levelUpOptions.forEach((skill, i) => {
        let x, y;
        if (levelUpOptions.length <= 3) {
          x = (GAME_WIDTH - totalW) / 2 + i * (cardW + spacing);
          y = (GAME_HEIGHT - cardH) / 2;
        } else {
          const col = i % 2;
          const row = Math.floor(i / 2);
          x = (GAME_WIDTH - totalW) / 2 + col * (cardW + spacing);
          y = (GAME_HEIGHT - (cardH * 2 + spacing)) / 2 + row * (cardH + spacing);
        }

        if (mx >= x && mx <= x + cardW && my >= y && my <= y + cardH) {
          found = i as any;
        }
      });
    } else if (gameState === 'PLAYING') {
      if (mx >= 660 && mx <= 740 && my >= 15 && my <= 55) {
        found = 500 as any;
      }
    } else if (gameState === 'PAUSED') {
      const w = 400, h = 450;
      const x = (750 - w) / 2, y = (1334 - h) / 2;
      const btnW = 300, btnH = 60;
      const btnX = (750 - btnW) / 2;
      [200, 201, 202].forEach((id, i) => {
        const btnY = y + 150 + i * 90;
        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
          found = id as any;
        }
      });
    } else if (gameState === 'REVIVE') {
      const btnW = 400;
      const btnH = 70;
      const bx = (GAME_WIDTH - btnW) / 2;
      const menuY = (GAME_HEIGHT - 500) / 2;
      
      if (mx >= bx && mx <= bx + btnW) {
        if (my >= menuY + 150 && my <= menuY + 150 + btnH) found = 10;
        else if (my >= menuY + 250 && my <= menuY + 250 + btnH) found = 11;
        else if (my >= menuY + 350 && my <= menuY + 350 + btnH) found = 12;
      }
    } else if (gameState === 'VICTORY') {
      const menuY = (GAME_HEIGHT - 500) / 2;
      const isShadowUnlocked = unlockedCharacterIds.includes('shadow') || isShadowWalkerUnlocked;
      if (!isShadowUnlocked) {
        const cardW = 300;
        const cx = (GAME_WIDTH - cardW) / 2;
        const cy = menuY + 150;
        
        const btnW = 120;
        const btnH = 50;
        const bx = cx + 20;
        const by = cy + 120;
        if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) found = 20;

        const backW = 120;
        const backH = 50;
        const backX = cx + cardW - backW - 20;
        const backY = cy + 120;
        if (mx >= backX && mx <= backX + backW && my >= backY && my <= backY + backH) found = 21;
      } else {
        const btnW = 200;
        const btnH = 50;
        const bx = (GAME_WIDTH - btnW) / 2;
        const by = menuY + 250;
        if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) found = 21;
      }
    } else if (gameState === 'GAME_OVER') {
      const menuY = (GAME_HEIGHT - 500) / 2;
      const btnW = 200;
      const btnH = 50;
      const bx = (GAME_WIDTH - btnW) / 2;
      const by = menuY + 250;
      if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) found = 21;
    }
    setHoveredIndex(found);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = (typeof wx !== 'undefined' ? (window as any).canvas : canvasRef.current) as HTMLCanvasElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const scaleX = GAME_WIDTH / (rect.width || canvas.width);
    const scaleY = GAME_HEIGHT / (rect.height || canvas.height);
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (gameState === 'PLAYING' && mx >= 660 && mx <= 740 && my >= 15 && my <= 55) {
      setMenuBtnState('pressed');
    }
  };

  const [joystickBase, setJoystickBase] = useState<{x: number, y: number} | null>(null);
  const [joystickStick, setJoystickStick] = useState<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const touch = e.touches[0];
    const scaleX = GAME_WIDTH / (rect.width || canvas.width);
    const scaleY = GAME_HEIGHT / (rect.height || canvas.height);
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top) * scaleY;

    if (ty > 150) { // Only trigger joystick in lower area
      setJoystickBase({ x: tx, y: ty });
      setJoystickStick({ x: tx, y: ty });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING' || !joystickBase) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const touch = e.touches[0];
    const scaleX = GAME_WIDTH / (rect.width || canvas.width);
    const scaleY = GAME_HEIGHT / (rect.height || canvas.height);
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top) * scaleY;

    const dx = tx - joystickBase.x;
    const dy = ty - joystickBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 60;

    let finalX = tx;
    let finalY = ty;
    if (dist > maxDist) {
      finalX = joystickBase.x + (dx / dist) * maxDist;
      finalY = joystickBase.y + (dy / dist) * maxDist;
    }

    setJoystickStick({ x: finalX, y: finalY });
    joystickDir.current = {
      x: (finalX - joystickBase.x) / maxDist,
      y: (finalY - joystickBase.y) / maxDist
    };
  };

  const handleTouchEnd = () => {
    setJoystickBase(null);
    setJoystickStick(null);
    joystickDir.current = { x: 0, y: 0 };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = (typeof wx !== 'undefined' ? (window as any).canvas : canvasRef.current) as HTMLCanvasElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    const scaleX = GAME_WIDTH / (rect.width || canvas.width);
    const scaleY = GAME_HEIGHT / (rect.height || canvas.height);
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (hoveredIndex !== null) {
      audioService.playCollect();
    }

    if (gameState === 'START' && hoveredIndex !== null) {
      if (hoveredIndex === 10) {
        resetGame();
      } else if (hoveredIndex === 11) {
        setGameState('CHARACTER_SELECT');
      } else if (hoveredIndex === 12) {
        setGameState('LEVEL_SELECT');
      } else if (hoveredIndex === 13) {
        setGameState('ACHIEVEMENTS');
      }
    } else if (gameState === 'ACHIEVEMENTS' && hoveredIndex !== null) {
      if (hoveredIndex === 1002) {
        setGameState('START');
      }
    } else if (gameState === 'LEVEL_SELECT' && hoveredIndex !== null) {
      if (hoveredIndex === 1000) {
        resetGame();
      } else if (hoveredIndex === 1001) {
        setGameState('START');
      } else if (hoveredIndex >= 0 && hoveredIndex < LEVELS.length) {
        setSelectedLevelId(LEVELS[hoveredIndex].id);
      }
    } else if (gameState === 'CHARACTER_SELECT' && hoveredIndex !== null) {
      if (hoveredIndex === 100) {
        setGameState('START');
      } else if (hoveredIndex >= 0 && hoveredIndex < CHARACTERS.length) {
        const char = CHARACTERS[hoveredIndex];
        if (unlockedCharacterIds.includes(char.id)) {
          setSelectedCharacterId(char.id);
        }
      }
    } else if (gameState === 'PLAYING') {
      if (mx >= 610 && mx <= 650 && my >= 15 && my <= 55) {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audioService.setMute(newMuted);
        return;
      }
      if (hoveredIndex === 500) {
        setGameState('PAUSED');
        return;
      }
      const player = playerRef.current;
      if (player.characterId === 'time') {
        const btnSize = 80;
        const bx = GAME_WIDTH - 120;
        const by = GAME_HEIGHT - 120;
        if (mx >= bx && mx <= bx + btnSize && my >= by && my <= by + btnSize) {
          const now = Date.now();
          const cooldownRemaining = Math.max(0, (player.lastSkillTime || 0) + (player.skillCooldown || 0) - now);
          if (cooldownRemaining === 0) {
            player.timeStasisTimer = 180; // 3 seconds
            player.lastSkillTime = now;
            setTutorialHint({ text: '时空静止！', life: 120 });
          }
        }
      }
    } else if (gameState === 'PAUSED' && hoveredIndex !== null) {
      if (hoveredIndex === 200) {
        setGameState('PLAYING');
      } else if (hoveredIndex === 201) {
        returnToMainMenu();
      } else if (hoveredIndex === 202) {
        resetGame();
        setGameState('PLAYING');
      }
    } else if (gameState === 'LEVEL_UP' && hoveredIndex !== null) {
      handleSkillSelect(levelUpOptions[hoveredIndex]);
      setHoveredIndex(null);
    } else if (gameState === 'REVIVE' && hoveredIndex !== null) {
      if (hoveredIndex === 10) {
        playerRef.current.hp = playerRef.current.maxHp;
        setGameState('PLAYING');
      } else if (hoveredIndex === 11) {
        playerRef.current.hp = playerRef.current.maxHp;
        setGameState('PLAYING');
      } else if (hoveredIndex === 12) {
        setGameState('GAME_OVER');
      }
      setHoveredIndex(null);
    } else if (gameState === 'VICTORY' && hoveredIndex !== null) {
      if (hoveredIndex === 20) {
        setIsShadowWalkerUnlocked(true);
        resetGame(true);
      } else if (hoveredIndex === 21) {
        returnToMainMenu();
      }
      setHoveredIndex(null);
    } else if (gameState === 'GAME_OVER' && hoveredIndex !== null) {
      if (hoveredIndex === 21) {
        returnToMainMenu();
      }
      setHoveredIndex(null);
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100vw', height: '100vh', display: 'block', background: '#000' }}
    />
  );
}
