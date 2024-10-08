import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './assets/App.scss'

function calculateDynamicHeight(container, level = 1) {
  const childNodes = container.querySelectorAll('.level-' + level)
  const childCount = childNodes.length

  let totalHeight = 0
  childNodes.forEach((child) => {
    totalHeight += child.offsetHeight
  })

  const averageHeight = totalHeight / childCount
  const finalHeight = totalHeight - averageHeight + (childCount - 1) * 20
  return `${finalHeight}px`
}

function NodeContainer({ children, level }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const dynamicHeight = calculateDynamicHeight(container, level)
      container.style.setProperty('--dynamic-height', dynamicHeight)
    }
  }, [children, level])

  return (
    <div ref={containerRef} className="child-node-container flex items-center dynamic-height">
      <div className={'absolute left-0'} style={{ height: 'var(--dynamic-height)' }}></div>
      <div className={'grid grid-flow-row grid-cols-1 gap-5 grid-container'}>{children}</div>
    </div>
  )
}

NodeContainer.propTypes = {
  children: PropTypes.node.isRequired,
  level: PropTypes.number.isRequired
}

function DecisionNode({ id, onSelect }) {
  return (
    <div
      className="child-node decision-node flex items-center relative"
      onClick={() => onSelect(id)}
    >
      <div className="h-20 w-20 border-4 border-gray-700 items-center text-center content-center rounded-xl">
        {id}
      </div>
      <div></div>
      <input
        type="text"
        className={'absolute left-2 top-0 w-28 border border-black rounded p-1 text-center'}
        placeholder="Decision"
      />
    </div>
  )
}

DecisionNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
}

function ChanceNode({ id, onSelect, expectedValue, onUpdate }) {
  const [decision, setDecision] = useState('')

  useEffect(() => {
    onUpdate(id, { decision })
  }, [decision])

  return (
    <div className="child-node chance-node flex items-center relative" onClick={() => onSelect(id)}>
      <div className="h-20 w-20 border-4 border-gray-700 items-center text-center content-center rounded-full relative">
        {id}
        <div className={'absolute top-[-3rem] w-full flex justify-center'}>
          <div className={'text-center p-2 bg-blue-200 rounded'}>{expectedValue}</div>
        </div>
      </div>
      <input
        type="text"
        className={'absolute left-2 top-0 w-28 border border-black rounded p-1 text-center'}
        placeholder="Decision"
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
      />
    </div>
  )
}

ChanceNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  expectedValue: PropTypes.number.isRequired
}

ChanceNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

function EndNode({ id, onSelect, onUpdate }) {
  const [outcome, setOutcome] = useState('')
  const [chance, setChance] = useState(0.0)
  const [value, setValue] = useState(0.0)

  useEffect(() => {
    onUpdate(id, { chance, value })
  }, [chance, value])

  return (
    <div className="child-node end-node flex items-center relative" onClick={() => onSelect(id)}>
      <div className="h-20 w-max flex items-center">
        <div
          className={
            'border-4 border-gray-700 items-center text-center content-center rounded-full'
          }
        ></div>
      </div>
      <div className={'absolute text-center right-[-70%] top-[-1rem] p-1 bg-blue-200 rounded w-28'}>
        {id}
      </div>
      <input
        type="text"
        className={'absolute w-28 border border-black rounded p-1 text-center left-2 top-0'}
        placeholder="Outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
      />
      <input
        type="number"
        className={'absolute w-28 border border-black rounded p-1 text-center left-2 bottom-0'}
        placeholder="Chance"
        value={chance}
        onChange={(e) => setChance(parseFloat(e.target.value))}
      />
      <input
        type="number"
        className={'absolute w-28 border border-black rounded p-1 text-center right-[-70%]'}
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
      />
    </div>
  )
}

EndNode.propTypes = {
  id: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

function NodeIdentifier({ level, id, Node, children, onSelect, onUpdate, expectedValue }) {
  return (
    <div id={id} className={`level-${level} flex items-center relative py-1`}>
      <Node id={id} onSelect={onSelect} onUpdate={onUpdate} expectedValue={expectedValue} />
      {children && <NodeContainer level={level + 1}>{children}</NodeContainer>}
    </div>
  )
}

NodeIdentifier.propTypes = {
  level: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  Node: PropTypes.elementType.isRequired,
  children: PropTypes.node,
  onSelect: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  expectedValue: PropTypes.number.isRequired
}

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedNodeType, setSelectedNodeType] = useState('DecisionNode')
  const [nodes, setNodes] = useState([])

  function generateRandomString(length) {
    const characters = '1234567890'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const handleNodeSelect = (id) => {
    setSelectedNodeId(id)
  }

  const handleNodeUpdate = (id, updates) => {
    const updateNodeRecursively = (nodes) => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, ...updates }
        } else if (node.children.length > 0) {
          return { ...node, children: updateNodeRecursively(node.children) }
        }
        return node
      })
    }
    setNodes(updateNodeRecursively(nodes))
  }
  const addNode = () => {
    if (selectedNodeId === 'root') {
      setNodes([
        ...nodes,
        {
          id: `ID${generateRandomString(4)}`,
          level: 1,
          type: getNodeType(selectedNodeType),
          children: []
        }
      ])
      return
    }

    const addNodeRecursively = (nodes) => {
      return nodes.map((node) => {
        if (node.id === selectedNodeId && node.type !== EndNode) {
          return {
            ...node,
            children: [
              ...node.children,
              {
                id: `ID${generateRandomString(4)}`,
                level: node.level + 1,
                type: getNodeType(selectedNodeType),
                children: [],
                chance: 0,
                value: 0
              }
            ]
          }
        } else if (node.children.length > 0) {
          return {
            ...node,
            children: addNodeRecursively(node.children)
          }
        }
        return node
      })
    }
    setNodes(addNodeRecursively(nodes))
  }

  const removeNode = () => {
    if (!selectedNodeId) return

    const removeNodeRecursively = (nodes) => {
      return nodes
        .filter((node) => node.id !== selectedNodeId)
        .map((node) => {
          if (node.children.length > 0) {
            return {
              ...node,
              children: removeNodeRecursively(node.children)
            }
          }
          return node
        })
    }

    setNodes(removeNodeRecursively(nodes))
    setSelectedNodeId(null)
  }

  const getNodeType = (type) => {
    switch (type) {
      case 'DecisionNode':
        return DecisionNode
      case 'ChanceNode':
        return ChanceNode
      case 'EndNode':
        return EndNode
      default:
        return DecisionNode
    }
  }

  const flattenNodes = (nodes) => {
    let flatList = []
    nodes.forEach((node) => {
      flatList.push(node)
      if (node.children.length > 0) {
        flatList = flatList.concat(flattenNodes(node.children))
      }
    })
    return flatList
  }

  const allNodes = flattenNodes(nodes)

  const renderNodes = (nodes) => {
    return nodes.map((node) => (
      <NodeIdentifier
        key={node.id}
        level={node.level}
        id={node.id}
        Node={node.type}
        onSelect={handleNodeSelect}
        onUpdate={handleNodeUpdate}
        expectedValue={getExpectedValue(node)}
      >
        {node.children.length > 0 && renderNodes(node.children)}
      </NodeIdentifier>
    ))
  }

  const getExpectedValue = (node) => {
    if (node.type !== getNodeType('ChanceNode')) {
      return 0
    }

    return node.children.reduce((acc, child) => {
      const value = child.value || 0
      const chance = (child.chance || 0) * 0.01
      return acc + value * chance
    }, 0)
  }

  const logChanceNodes = () => {
    const chanceNodes = allNodes.filter((node) => node.type === getNodeType('ChanceNode'))
    chanceNodes.forEach((node) => {
      const expectedValue = getExpectedValue(node)
      console.log(`ID: ${node.id}, Expected Value: ${expectedValue}`)
    })
  }
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className={'flex justify-center items-center flex-grow relative p-24'}>
      <div className={'root-node flex items-center'} onClick={() => handleNodeSelect('root')}>
        <div
          className={
            'h-20 w-20 border-4 border-gray-700 items-center text-center content-center rounded-xl'
          }
        >
          Root Node
        </div>
      </div>
      <NodeContainer level={1}>{renderNodes(nodes)}</NodeContainer>
      <div
        className={
          'fixed bottom-10 right-40 grid grid-flow-row gap-5 p-6 bg-slate-100 rounded border-2'
        }
      >
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-gray-500 text-white rounded">
          {isOpen ? 'Close' : 'Open'} Controls
        </button>
        {isOpen && (
          <select
            className={'border-2 rounded'}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            value={selectedNodeId || ''}
          >
            <option value="" disabled>
              Select Node ID
            </option>
            <option value="root">Root Node</option>
            {allNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.id}
              </option>
            ))}
          </select>
        )}
        {isOpen && (
          <select
            className={'border-2 rounded'}
            onChange={(e) => setSelectedNodeType(e.target.value)}
            value={selectedNodeType}
          >
            <option value="DecisionNode">Decision Node</option>
            <option value="ChanceNode">Chance Node</option>
            <option value="EndNode">End Node</option>
          </select>
        )}
        {isOpen && (
          <button onClick={addNode} className="p-2 bg-blue-500 text-white rounded">
            Add Node
          </button>
        )}
        {isOpen && (
          <button onClick={removeNode} className="p-2 bg-red-500 text-white rounded">
            Remove Node
          </button>
        )}
        {isOpen && (
          <button onClick={logChanceNodes} className="p-2 bg-green-500 text-white rounded">
            Log Chance Nodes
          </button>
        )}
      </div>
    </div>
  )
}

export default App
