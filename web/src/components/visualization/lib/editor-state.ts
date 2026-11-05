/**
 * The contour editor's state, as the editor reports it and the dock and the
 * view read it. One declaration, three consumers: ContourEditorCanvas emits it
 * (`stateChange`), EditorControlsDock takes it as props, and VisualizationView
 * holds it (fr-VisualizationView L-23, homed to X·F F-TAIL; COHESION §0hs.3).
 */
export interface EditorState {
    canUndo: boolean;
    canRedo: boolean;
    canDelete: boolean;
    pointCount: number;
}
