import React from "react";

// ----------------------
// state model
// ----------------------
interface Vector {
	x: number;
	y: number;
}

interface SpringForce {
	damping: number;
  stiffness: number;
  position: number;
}

interface AnimationProp {
  value: number;
  velocity: number;
  force: number;
  inversedMass: number;
}

interface State {
  timeStamp: number; // millisecond
  updateCount: number; // 10 millisecond => 0.01 second
  springForce1: SpringForce;
  xPosition: AnimationProp;
  ballMouseDown: boolean;
  mousePosition: Vector;
}

const initSpringForce1: SpringForce = {
	damping: 0.7,
  stiffness: 0.3,
  position: 200,
}

const initXPosition: AnimationProp = {
  value: 30,
  velocity: 0,
  force: 0,
  inversedMass: 1/4,
}

const initState: State = {
  timeStamp: 0,
  updateCount: 0,
  springForce1: initSpringForce1,
  xPosition: initXPosition,
  ballMouseDown: false,
  mousePosition: {x: 0, y: 0},
}


// ----------------------
// action model
// ----------------------
const tick = (tick: number) => ({
  type: 'TICK' as const,
  payload: {timeStamp: tick},
})

const ballMouseDown = (a: boolean) => ({
  type: 'BALL_MOUSE_DOWN' as const,
  payload: {ballMouseDown: a},
})

const mouseMove = (a: Vector) => ({
  type: 'MOUSE_MOVE' as const,
  payload: {mousePosition: a},
})

type Action = ReturnType<typeof tick> | ReturnType<typeof ballMouseDown> | ReturnType<typeof mouseMove>


// ----------------------
// lib
// ----------------------
const updateAnimationProp = (a: AnimationProp): AnimationProp => ({
  ...a,
  value: a.value + a.velocity + 0.5 * a.force * a.inversedMass,
  velocity: a.velocity + a.force * a.inversedMass,
  force: 0,
})

const applySpringForce = (a: AnimationProp) => (f: SpringForce): AnimationProp => {
  const distance = f.position - a.value
  const friction = -1 * a.velocity * f.damping
  const force = f.stiffness * distance + friction
  return {
    ...a,
    force: force,
  }
}

// ----------------------
// update
// ----------------------
const reducer = (state: State, action: Action): State => {
  switch(action.type) {
    case 'TICK':
      if(state.ballMouseDown) return state

      const xPosition = updateAnimationProp(state.xPosition)
      const xPosition2 = applySpringForce(xPosition)(state.springForce1)

      const shouldBeThisVersion: number = state.timeStamp / 10
      const behindVersion: boolean = shouldBeThisVersion > state.updateCount
      const tooFarBehind: boolean = shouldBeThisVersion + 50 > state.updateCount
    
      const finalState: State = {
        ...state,
        timeStamp: action.payload.timeStamp,
        updateCount: state.updateCount + 1,
        xPosition: xPosition2,
      }

      return behindVersion && !tooFarBehind ? reducer(finalState, action) : finalState

    case 'MOUSE_MOVE':
      return {
        ...state,
        mousePosition: action.payload.mousePosition,
        xPosition: {
          ...state.xPosition,
          value: state.ballMouseDown ? action.payload.mousePosition.x : state.xPosition.value
        }
      }
    case 'BALL_MOUSE_DOWN':
      return {
        ...state,
        ballMouseDown: action.payload.ballMouseDown,
      }
  }
}

// ----------------------
// draw
// ----------------------
const Ball: React.FC = () => {

  const [state, dispatch] = React.useReducer(reducer, initState)

  const animationRef = React.useRef(0)
  const circleRef = React.useRef<SVGRectElement>(null)

  const step = (t1: number) => (t2: number) => {
      if (t2 - t1 > 10) {
          dispatch(tick(t2))
          animationRef.current = requestAnimationFrame(step(t2))
      } else {
          animationRef.current = requestAnimationFrame(step(t1))
      }
  }

  React.useEffect(() => {
    animationRef.current = requestAnimationFrame(step(0))
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  React.useEffect(() => {
    if(circleRef.current){
      circleRef.current.addEventListener('mousedown', e => {
        dispatch(ballMouseDown(true))
      })
    
      circleRef.current.addEventListener('mouseup', e => {
        dispatch(ballMouseDown(false))
      })
    }
  }, [circleRef])

  React.useEffect(() => {
    window.addEventListener('mousemove', e => {
      dispatch(mouseMove({x: e.clientX, y: e.clientY}))
    })
  }, [])

  return (
    <>
      <svg width="100%" height="100%">
        <rect 
          fill = 'green'
          width = '60'
          height = '60'
          x = {state.xPosition.value.toString()}
          y = '30'
          ref = {circleRef}
        />
      </svg>
    </>
  )
}

export default Ball
