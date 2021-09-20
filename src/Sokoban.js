import React, {useEffect, useReducer} from "react"

const LEVELS = [ // 0=playground, 1=wall, 2=box (playground bellow), 4=storage, 5=player (playground bellow), 8=outside world
    [ // level 1      
      [8,8,8,8,1,1,1,1,1,8,8,8,8,8,8,8,8,8,8],
      [8,8,8,8,1,0,0,0,1,8,8,8,8,8,8,8,8,8,8],
      [8,8,8,8,1,2,0,0,1,8,8,8,8,8,8,8,8,8,8],
      [8,8,1,1,1,0,0,2,1,1,8,8,8,8,8,8,8,8,8],
      [8,8,1,0,0,2,0,2,0,1,8,8,8,8,8,8,8,8,8],
      [1,1,1,0,1,0,1,1,0,1,8,8,8,1,1,1,1,1,1],
      [1,0,0,0,1,0,1,1,0,1,1,1,1,1,0,0,4,4,1],
      [1,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,4,4,1],
      [1,1,1,1,1,0,1,1,1,0,1,5,1,1,0,0,4,4,1],
      [8,8,8,8,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
      [8,8,8,8,1,1,1,1,1,1,1,8,8,8,8,8,8,8,8],
    ],
    [ // level 2      
      [1,1,1,1,1,1,1,1,1,1,1,1,8,8],
      [1,4,4,0,0,1,0,0,0,0,0,1,1,1],
      [1,4,4,0,0,1,0,2,0,0,2,0,0,1],
      [1,4,4,0,0,1,2,1,1,1,1,0,0,1],
      [1,4,4,0,0,0,0,5,0,1,1,0,0,1],
      [1,4,4,0,0,1,0,1,0,0,2,0,1,1],
      [1,1,1,1,1,1,0,1,1,2,0,2,0,1],
      [8,8,1,0,2,0,0,2,0,2,0,2,0,1],
      [8,8,1,0,0,0,0,1,0,0,0,0,0,1],
      [8,8,1,1,1,1,1,1,1,1,1,1,1,1],
    ] 
  ]
//             0       1       2        3     4         5       6     7        8  
const COLOR = ["#ddd", "#777", "brown", null, "orange", "#000", null, "green", "transparent"]
const COLOR_IN_PLACE = 7 // index of green color from COLORS
const ITEM = {
  Playground:       0,
  Wall:             1,
  Box:              2,
  Storage:          4,
  Player:           5,
  World:            8 
}
const GAME_STATE = { 
  Running:          "RUNNING", 
  Done:             "DONE" 
} 
const ACTION = {
  Move:             "MOVE", 
  RestartLevel:     "RESTART_LEVEL",
  PlayNextLevel:    "PLAY_NEXT_LEVEL"
}
const DIRECTION = { 
  Left:             37, 
  Right:            39, 
  Up:               38, 
  Down:             40 
}

function getInitialState(levelNo) {
  const LEVEL = LEVELS[levelNo]
  let level = [], player = {x: null, y: null}, box = []
  // parse level and init objects
  for (let y=0; y<LEVEL.length; y++) {
    level[y] = []
    for (let x=0; x<LEVEL[y].length; x++) {
      if ( [ITEM.Box, ITEM.Player].includes(LEVEL[y][x])) 
        // cast Box, Player as Playground
        level[y][x] = ITEM.Playground 
      else // otherwise get type from the level map
        level[y][x] = LEVEL[y][x] 
      if (LEVEL[y][x] === ITEM.Box)     box.push({x:x, y:y})    // fill the array of boxes
      if (LEVEL[y][x] === ITEM.Player)  player = {x:x, y:y}     // initial player position
    }
  }
  return {
    levelNo:  levelNo,
    status:   GAME_STATE.Running,
    level, player, box
  }
}

function GameReducer(state, action) {
  switch (action.type) {
    case ACTION.RestartLevel:
      return {...getInitialState(state.levelNo), status: GAME_STATE.Running}
    case ACTION.PlayNextLevel:
      return {...getInitialState(state.levelNo+1), status: GAME_STATE.Running}
    case ACTION.Move:
      let d = {x: 0, y: 0} 
      console.log(action.keyCode)
      if (DIRECTION.Left === action.keyCode)  d.x-- 
      if (DIRECTION.Right === action.keyCode) d.x++
      if (DIRECTION.Up === action.keyCode)    d.y--
      if (DIRECTION.Down === action.keyCode)  d.y++
      // check walls
      if ( state.level[state.player.y+d.y][state.player.x+d.x] === ITEM.Wall) return {...state}
      // check if the player is trying to move the box
      if ( [...state.box].find(b => b.x===state.player.x+d.x && b.y===state.player.y+d.y) ) {
        // check whether it's possible to move the box
        if ( 
          [ITEM.Playground, ITEM.Storage].includes(state.level[state.player.y+2*d.y][state.player.x+2*d.x])  // check free space space behind box
          && ![...state.box].find(b => b.x === state.player.x+2*d.x && b.y === state.player.y+2*d.y)         // check box-free space behind box
        ) { // return new position with moved box
          let newState = {...state, player: {x: state.player.x+d.x, y: state.player.y+d.y}, box: [...state.box].map(b => {
            // IF the player tries to move to the box's position
            if ( (b.x === state.player.x+d.x) && (b.y === state.player.y+d.y) ) 
              return {x: b.x+d.x, y: b.y+d.y}
            else
              return b
          } ) }
          // check level completed OR game finished
          let boxesInPlace = 0
          newState.box.forEach(b=>{ if (newState.level[b.y][b.x] === ITEM.Storage) boxesInPlace++ })
          if (boxesInPlace === newState.box.length) return {...newState, status:GAME_STATE.Done}
          return newState
        } else // cannot move the box, player must stay at the same position
          return {...state}
      }
      // standard movement without interaction with the boxes
      return {...state, player: {x: state.player.x+d.x, y: state.player.y+d.y}}
    default:  
  }
  return state
}

function getColor(y,x, color, player, box, isStorage) {
  if (player.y === y && player.x === x)                   return ITEM.Player
  if (box.find( b => (b.y===y && b.x===x)) && isStorage ) return COLOR_IN_PLACE // index of the green color  
  if (box.find( b => (b.y===y && b.x===x)))               return ITEM.Box  
  return color
}

export default function Sokoban() {
  let [state, dispatch] = useReducer(GameReducer, getInitialState(0) )
  console.log(state)

  function handleMove(e) {
    if ( [DIRECTION.Left, DIRECTION.Right, DIRECTION.Up, DIRECTION.Down].includes(e.keyCode) ) {
      e.preventDefault(); 
      dispatch({type: ACTION.Move, keyCode: e.keyCode}) 
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleMove); 
    return () => { document.removeEventListener('keydown', handleMove); }              // destroy
  });  

  return (
    <div className="Sokoban">
      <div>React Sokoban. controls: LEFT, RIGHT, UP, DOWN. colors: black=player, brown=box, orange=destination, green=box in place</div>
      <button onClick={()=> dispatch({type: ACTION.RestartLevel})}>Restart level</button>
      {state.status === GAME_STATE.Done && state.levelNo<LEVELS.length-1 && <button onClick={()=> dispatch({type: ACTION.PlayNextLevel})}>Next level</button>}
      {state.status === GAME_STATE.Done && <h3>Level completed!</h3>}
        {[...state.level].map( (row, y) => {
          return <div key={`${y}`} style={{display: 'block', lineHeight: 0}}>{
            row.map( (col, x) => {return <div key={`${y}-${x}`} style={{backgroundColor: COLOR[getColor(y,x, col, state.player, state.box, state.level[y][x]===ITEM.Storage)], width: "20px", height:"20px", display:"inline-block", border: state.level[y][x]===ITEM.World ? '1px solid transparent': '1px solid #ccc'}}/>})  
          }</div> 
        })}
    </div>
  );
}
