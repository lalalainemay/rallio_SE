'use client'

import { createPathComponent } from '@react-leaflet/core'
import L from 'leaflet'
import 'leaflet.markercluster'

interface MarkerClusterGroupProps {
  children: React.ReactNode
  chunkedLoading?: boolean
  maxClusterRadius?: number
  spiderfyOnMaxZoom?: boolean
  showCoverageOnHover?: boolean
  zoomToBoundsOnClick?: boolean
}

const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount()
  let size = 'small'
  if (count > 10) size = 'medium'
  if (count > 100) size = 'large'

  const color = count > 100 ? '#E53E3E' : count > 10 ? '#DD6B20' : '#38A169'

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true),
  })
}

function createMarkerClusterGroup(props: MarkerClusterGroupProps, context: any) {
  const clusterProps: any = {}
  const clusterEvents: any = {}

  // Splitting props and events to different objects
  Object.entries(props).forEach(([propName, prop]) => {
    if (propName.startsWith('on')) {
      clusterEvents[propName] = prop
    } else {
      clusterProps[propName] = prop
    }
  })

  // Create markerClusterGroup Leaflet element
  const markerClusterGroup: any = L.markerClusterGroup({
    ...clusterProps,
    iconCreateFunction: createClusterCustomIcon,
  })

  return {
    instance: markerClusterGroup,
    context: { ...context, layerContainer: markerClusterGroup },
  }
}

const MarkerClusterGroup = createPathComponent(createMarkerClusterGroup)

export default MarkerClusterGroup
