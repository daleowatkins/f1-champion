import type { SlotType } from '../types/game'
import type { DriverSlot } from '../engine/spinPool'

export interface ComponentEffect {
  title: string
  body: string
}

export const SLOT_EFFECTS: Record<SlotType, ComponentEffect> = {
  driver1: {
    title: 'Race pace · Driver 1',
    body: 'Your lead driver. Pace comes from their OVR and your car — a great driver in a weak car is still held back. Gets a form boost if you prioritise Driver 1.',
  },
  driver2: {
    title: 'Race pace · Driver 2',
    body: 'Your second race driver. Uses the same pace rules as Driver 1. May run slightly behind if you chose to favour Driver 1 in pre-season.',
  },
  chassis: {
    title: 'Car performance',
    body: 'Half of your car rating. Sets the baseline speed of the package and how much of a driver’s talent actually converts into lap time.',
  },
  engine: {
    title: 'Car performance',
    body: 'The other half of your car rating. A stronger unit raises your ceiling and helps both drivers fight further up the grid.',
  },
  teamPrincipal: {
    title: 'Team support',
    body: 'Leadership and operations — 60% of your support rating. Higher OVR means more consistent weekends with fewer random swings.',
  },
  engineerCrew: {
    title: 'Pit stops & reliability',
    body: 'Your pit crew. Better engineers mean fewer slow or messy pit stops and a lower chance of mechanical DNFs for your drivers.',
  },
  devBudget: {
    title: 'In-season development',
    body: 'R&D spend across the year. A bigger budget helps your car gain pace as the season goes on — especially valuable in longer calendars.',
  },
  reserveDriver: {
    title: 'Team support',
    body: 'Development driver — 40% of your support rating. Improves weekend consistency and reduces how much luck swings your results.',
  },
}

const DRIVER_CATEGORY_EFFECT: ComponentEffect = {
  title: 'Race drivers',
  body: 'Drivers set your race pace together with the car. OVR is talent; the car still does most of the heavy lifting. Pick Driver 1, Driver 2, or slot someone as Development.',
}

export function getSlotEffect(slot: SlotType): ComponentEffect {
  return SLOT_EFFECTS[slot]
}

export function getDriverCategoryEffect(): ComponentEffect {
  return DRIVER_CATEGORY_EFFECT
}

export function getDriverRoleHint(slot: DriverSlot): string {
  switch (slot) {
    case 'driver1':
      return 'Fills Driver 1 — lead race seat'
    case 'driver2':
      return 'Fills Driver 2 — second race seat'
    case 'reserveDriver':
      return 'Fills Development — boosts support, not race pace'
  }
}
