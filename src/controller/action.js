const { itemManager, monsterManager } = require("../datas/Manager");
const item = require('../datas/items.json');
const express = require("express");


const eventProb = [0.1, 0.4, 1]; // nothing, item, battle

async function action (req, res) {

    let event='', system='';

    const { action } = req.body;
    const player = req.player;
    
    if (action === "reroll") {
      player.str = Math.floor(Math.random()*5);
      player.int = Math.floor(Math.random()*5);
      player.reroll -= 1;
      event = '능력치를 재설정했다.';
      system = '남은 재설정 횟수: ' + player.reroll;
      if (player.reroll === 0) {
        player.status = 1;
      }
      await player.save();
      return res.send(_draw(player, event, system));
    }

    if (action === "query") {
      if (player.status === 0) {
        event = '모험 시작! 능력치를 5번 까지 재설정 할 수 있다.';
      }
      if (player.status === 2) {
        event = '적을 만났다.'
      }
      if (player.status === 3) {
        event = '전투 중이다.'
      }
      return res.send(_draw(player, event, system));
    }
    
    if (action === "move") {
      player.status = 1;
      const d = req.body.direction;
      const move = {
        "0": [0, -1],
        "1": [1, 0],
        "2": [0, 1],
        "3": [-1, 0]
      };
      const mx = move[d][0];
      const my = move[d][1];
      if (player.x + mx < 0 || player.y + my < 0 || player.x + mx > 9 || player.y + my > 9) {
        system = "그 쪽으로는 움직일 수 없다.";
        return res.send(_draw(player, '', system));
      }      
      
      player.move += 1;
      player.x += mx;
      player.y += my;

      const sample = Math.random();

      if (sample < eventProb[0]) { // nothing
        event = "아무 일도 일어나지 않았다."
      }
      else if (sample < eventProb[1]) { // item
        const item = itemManager.getRandom();
        const { id, name, str, int, hp } = _stat(player, item);
        player.items.push(name);
        player.itemIds.push(id);        
        player.str += str;
        player.int += int;
        player.incrementHP(hp);
        event = `${name}을(를) 얻었다! \n str이 ${str} int가 ${int} hp가 ${hp} 증가했다!`;
      }
      else { // battle
        player.status = 2;
        const monster = monsterManager.getRandom();
        const { id, name, str, int, hp } = _stat(player, monster);
        player.enemy = { name, hp, turn: 0 };
        event = `${name}을(를) 만났다! \n 상대는 hp: ${hp} str:${str} int:${int}이다!`;
      }
      await player.save();
      return res.send(_draw(player, event, system));
    }

    if (action === 'hit') {
      player.status = 3;

      const monster = monsterManager.get(player.enemy.name);
      const { id, name, str, int, hp } = _stat(player, monster);
      const damage = monster.damage[player.stage];

      const sample = Math.random();
      
      player.enemy.turn += 1;
      if (player.enemy.turn >= 10) {
        player.status = 2;
      }
      system = `전투 중.... (${player.enemy.turn}턴 째)`;

      if (sample > (int + str) / (int + str + player.str + player.int )) {
        if (player.HP <= 0.2*player.maxHP) {
          player.status = 2;
        }
        player.enemy.hp -= damage;
        event = `[${player.enemy.name}과 전투중]\n공격에 성공했다.\n${damage}의 피해를 입혔다.\n(적의 남은 체력: ${player.enemy.hp})`;

        if (player.enemy.hp <= 0) {
          event = `적을 무찔렀다.`;
          system = '';
          player.incrementEXP(monster.exp[player.stage]);
          player.status = 1;
          if (player.level === 4) {
            player.stage = 1;
          }
          if (player.level === 8) {
            player.stage = 2;
          }
          if (player.level === 12) {
            player.status = -1;
            event = '졸업을 축하합니다.';
            system = '게임 종료.';
          }
        }
      }
      else {
        player.HP -= damage;
        event = `[${player.enemy.name}과 전투중]\n공격에 실패했다.\n${damage}의 피해를 입었다!\n(적의 남은 체력: ${player.enemy.hp})`;
        if (player.HP <= 0.2*player.maxHP) {
          player.status = 2;
        }
        if (player.HP <= 0) {
          event = `죽어버렸다...`;
          
          player.HP = player.maxHP/2;
          player.exp = 0;

          const removeItemIndex = Math.floor(Math.random()*player.items.length);
          const removedId = player.itemIds[removeItemIndex];
          const removedItem = player.items[removeItemIndex];
          const removedStatus = item[removedId].name.indexOf(removedItem);
          const removedStr = item[removedId].str[removedStatus];
          const removedInt = item[removedId].int[removedStatus];

          player.items.splice(removeItemIndex,1);
          player.itemIds.splice(removeItemIndex,1);
          player.str -= removedStr;
          player.int -= removedInt;
          console.log(removedItem);
          console.log(item[removedId].str[removedStatus]);
          console.log(item[removedId].int[removedStatus]);
          player.x = 0;
          player.y = 0;
          player.status = 1;
          system = `경험치가 초기화 되었다.\n체력을 50% 회복했다.\n위치가 원점으로 돌아간다.\n ${removedItem}을(를) 잃었다.\n str ${removedStr}, int ${removedInt}만큼 줄었다.`
        }
      }
      await player.save();
      return res.send(_draw(player, event, system));
    }
  }

module.exports = {
    action
}

function _draw (player, event='', system='') {
  const minimap = _map(player.x, player.y);
  const inventory = _list(player.items);
  return { player, minimap, inventory, event, system };
}

function _map(x, y) {
  const blankline = '□□□□□□□□□□'+'\n';
  const currentline = '□'.repeat(x)+'■'+'□'.repeat(9-x)+'\n';
  const map = blankline.repeat(y)+currentline+blankline.repeat(9-y);
  return map;
}

function _list(items) {
  let res = {};
  for (let i of items) {
    res[i] = i in res? res[i]+1 : 1;
  }
  const x = Object.keys(res).reduce((acc, cur) => acc + `${cur} : ${res[cur]}개\n`, '');
  return x;
}

function _stat(player, x) {
  const id=x.id;
  const name = x.name[player.stage];
  const str = x.str[player.stage];
  const int = x.int[player.stage];
  const hp = x.hp[player.stage];
  return { id, name, str, int, hp };
}

function _findItem(itemName){

}