// ============================================================================
// File: Image.gs
// Desc: A bitmap rendering context.
// ============================================================================
include "Soup.gs"



// ============================================================================
// Name: Image
// Desc: A bitmap rendering context.
// ============================================================================
final game class Image
{
  // ============================================================================
  // Name: Clear
  // Desc: Sets the image to the specified size and clears it to black with zero
  //       alpha.
  // Parm: width - The new image width, in pixels.
  // Parm: height - The new image height, in pixels.
  // ============================================================================
  public native void Clear(int width, int height);
  
  
  // ============================================================================
  // Name: Resize
  // Desc: Resizes the image to the specified size. If bStretch is set, the 
  //       existing image data is scale to fit the new size. Otherwise, the 
  //       existing image data is left untouched where possible and any new
  //       space is filled to black with zero alpha.
  // Parm: width - The new image width, in pixels.
  // Parm: height - The new image height, in pixels.
  // Parm: bStretch - If set, causes the existing pixel data to be scaled.
  // ============================================================================
  public native void Resize(int width, int height, bool bStretch);
  
  
  // ============================================================================
  // Name: GetWidth
  // Desc: Return this Image's width.
  // Retn: Width in pixels.
  // ============================================================================
  public native int GetWidth(void);
  
  
  // ============================================================================
  // Name: GetHeight
  // Desc: Return this Image's height.
  // Retn: Height in pixels.
  // ============================================================================
  public native int GetHeight(void);
  
  
  // ============================================================================
  // Name: SetLineColor
  // Desc: Sets the line color to the specified value. This is used for points, 
  //       lines, and the frame of other primitives. The initial value is white 
  //       with full alpha. The color numbers are in the range of 0.0 (black, 
  //       transparent) to 1.0 (white, opaque.)
  // Parm: red - The value for the red color channel.
  // Parm: green - The value for the green color channel.
  // Parm: blue - The value for the blue color channel.
  // Parm: alpha - The value for the alpha channel.
  // ============================================================================
  public native void SetLineColor(float red, float green, float blue, float alpha);
  
  
  // ============================================================================
  // Name: SetFillColor
  // Desc: Sets the fill color to the specified value. This is used for the inner
  //       area of primitives. The initial value has zero alpha. The color
  //       numbers are in the range of 0.0 (black, transparent) to 1.0
  //       (white, opaque.)
  // Parm: red - The value for the red color channel.
  // Parm: green - The value for the green color channel.
  // Parm: blue - The value for the blue color channel.
  // Parm: alpha - The value for the alpha channel.
  // ============================================================================
  public native void SetFillColor(float red, float green, float blue, float alpha);
  
  
  // ============================================================================
  // Name: DrawPoint
  // Desc: Draws a point at the specified location using the current line color.
  // Parm: x - The x coordinate.
  // Parm: y - The y coordinate.
  // ============================================================================
  public native void DrawPoint(int x, int y);
  
  
  // ============================================================================
  // Name: DrawRect
  // Desc: Draws a rectangle at the specified location using the current line and 
  //       fill colors.
  // Parm: left - The left coordinate.
  // Parm: top - The top coordinate.
  // Parm: right - The right coordinate.
  // Parm: bottom - The bottom coordinate.
  // ============================================================================
  public native void DrawRect(int left, int top, int right, int bottom);
  
  
  // ============================================================================
  // Name: DrawLine
  // Desc: Draws a line between the specified coordinates using the current line 
  //       color.
  // Parm: x0 - The x coordinate of the start point.
  // Parm: y0 - The y coordinate of the start point.
  // Parm: x1 - The x coordinate of the end point.
  // Parm: y1 - The y coordinate of the end point.
  // ============================================================================
  public native void DrawLine(int x0, int y0, int x1, int y1);
  
  
  // ============================================================================
  // Name: DrawCircle
  // Desc: Draws a circle at the specified location using the current line and 
  //       fill colors.
  // Parm: x - The x coordinate.
  // Parm: y - The y coordinate.
  // Parm: radius - The radius of the circle.
  // ============================================================================
  public native void DrawCircle(int x, int y, int radius);
  
  
  // ============================================================================
  // Name: DrawTriangle
  // Desc: Draws a triangle at the specified location using the current line and 
  //       fill colors.
  // Parm: x0 - The x coordinate of the first point.
  // Parm: y0 - The y coordinate of the first point.
  // Parm: x1 - The x coordinate of the second point.
  // Parm: y1 - The y coordinate of the second point.
  // Parm: x2 - The x coordinate of the third point.
  // Parm: y2 - The y coordinate of the third point.
  // ============================================================================
  public native void DrawTriangle(int x0, int y0, int x1, int y1, int x2, int y2);
  
  
  // ============================================================================
  // Name: DrawImage
  // Desc: Draws the source image into this Image such that its top-left corner
  //       is situated at the specified coordinate. The source image data is
  //       multiplied by the current fill color. Source alpha is used to blend
  //       the source image into this Image.
  //       The source and destination images may be the same.
  // Parm: x - The x coordinate.
  // Parm: y - The y coordinate.
  // Parm: source - The source image.
  // ============================================================================
  public native void DrawImage(int x, int y, Image source);
  
  
  // ============================================================================
  // Name: DrawImage
  // Desc: Draws the source image into the specified rectangle on this Image,
  //       scaling if necessary. The source image data is multiplied by the
  //       current fill color. Source alpha is used to blend the source image
  //       into this Image.
  //       The source and destination should not be the same Image.
  // Parm: dstLeft - The left destination coordinate.
  // Parm: dstTop - The top destination coordinate.
  // Parm: dstRight - The right destination coordinate.
  // Parm: dstBottom - The bottom destination coordinate.
  // Parm: source - The source image.
  // ============================================================================
  public native void DrawImage(int dstLeft, int dstTop, int dstRight, int dstBottom, Image source);
  
  
  // ============================================================================
  // Name: DrawImage
  // Desc: Draws a subset of the source image into the specified rectangle on 
  //       this Image, scaling if necessary. The source image data is multiplied 
  //       by the current fill color. Source alpha is used to blend the source 
  //       image into this Image.
  //       The source and destination images may be the same, however in this 
  //       case care should be taken to avoid overlapping the source and 
  //       destination areas if scaling is in use.
  // Parm: dstLeft - The left destination coordinate.
  // Parm: dstTop - The top destination coordinate.
  // Parm: dstRight - The right destination coordinate.
  // Parm: dstBottom - The bottom destination coordinate.
  // Parm: source - The source image.
  // Parm: srcLeft - The left source coordinate.
  // Parm: srcTop - The top source coordinate.
  // Parm: srcRight - The right source coordinate.
  // Parm: srcBottom - The bottom source coordinate.
  // ============================================================================
  public native void DrawImage(int dstLeft, int dstTop, int dstRight, int dstBottom, Image source, int srcLeft, int srcTop, int srcRight, int srcBottom);
  
  
  // ============================================================================
  // Name: SetTextFont
  // Desc: Sets the text font to the specified values. Note that Trainz does not 
  //       allow access to all fonts installed on the local computer for 
  //       compatibility reasons, but rather provides a fixed font set.
  // Parm: fontName - The Trainz font name.
  // Parm: fontSize - The font size in points.
  // ============================================================================
  public native void SetTextFont(string fontName, int fontSize);
  
  
  // ============================================================================
  // Name: MeasureTextWidth
  // Desc: Returns the width of the specified text.
  // Parm: text - The text to measure.
  // Retn: int - The width in pixels.
  // ============================================================================
  public native int MeasureTextWidth(string text);
  
  
  // ============================================================================
  // Name: DrawText
  // Desc: Draws the specified text at the specified location using the current
  //       font and line color. (TBD: describe how the coordinate relates to
  //       the font rectangle.)
  // Parm: x - The x coordinate.
  // Parm: y - The y coordinate.
  // Parm: text - The text to draw.
  // ============================================================================
  public native void DrawText(int x, int y, string text);
  
  
  // ============================================================================
  // Name: ExportImage
  // Desc: Exports the image data to a Soup. The caller should not make 
  //       assumptions about the contents of the Soup, nor attempt to manipulate
  //       the resultant Soup directly, however the Soup may be embedded in 
  //       another Soup, passed to other subsystems, stored, etc. Keep in mind
  //       that the resultant Soup is likely to be quite large.
  // Retn: Soup - A soup containing private data which describes this Image's
  //       pixel data.
  // ============================================================================
  public native Soup ExportImage(void);
  
  
  // ============================================================================
  // Name: ImportImage
  // Desc: Imports a Soup which was previously created by ExportImage(). If the
  //       Soup data was not originally created using ExportImage() then 
  //       ImportImage() will throw a script exception.
  // Parm: Soup - a soup containing private data created by ExportImage().
  // ============================================================================
  public native void ImportImage(Soup soup);
};