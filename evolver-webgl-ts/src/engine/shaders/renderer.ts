export function vert(): string {
    return `
    // an attribute will receive data from a buffer
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
   
    // all shaders have a main function
    void main() {
        // convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;
     
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;
     
        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
     
        gl_Position = vec4(clipSpace, 0, 1);
        v_color = a_color;
        v_texCoord = a_texCoord;
    }`;
}

export function frag(): string {
    return `
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default
    precision mediump float;
    uniform int u_deleted;
    uniform sampler2D u_base;

    varying vec4 v_color;
    varying vec2 v_texCoord;
   
    void main() {
      if (u_deleted == 0) {
        gl_FragColor = v_color;
      } else {
        // overwrite previous render with base texture
        gl_FragColor = texture2D(u_base, v_texCoord);
      }
    }`;
}
