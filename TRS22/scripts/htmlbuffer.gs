//=============================================================================
// File: HTMLBuffer.gs
// Desc: A string buffer optimised for output streaming, with utility functions
//       for HTML support.
//=============================================================================
include "gs.gs"
include "asset.gs"
include "asyncqueryhelper.gs"



//=============================================================================
// Name: HTMLBuffer
// Desc: An html buffer object. Can be loaded from a file or manually printed
//       to. Supports extraction of the loaded html data, clearing, etc.
//=============================================================================
game class HTMLBuffer isclass GSObject
{

  //=============================================================================
  // Name: LoadHTMLFile
  // Desc: Clears this buffer, then loads it with HTML from a file within the
  //       specified asset. Note that any asset local files referenced by the
  //       loaded HTML page (e.g. images) require the end user of this HTMLBuffer
  //       to reference the same asset, or they may not work. For example, if you
  //       load a HTML file using this function, then pass the contents of this
  //       buffer to Browser.LoadHTMLString(), then you must pass the same asset
  //       to both functions.
  // Parm: asset - The asset to load the HTML file from. Asset must be locally
  //       installed and available (i.e. compatible, not faulty, etc).
  // Parm: htmlPageFile - The filename of the HTML file relative to the asset
  //       specified. Must be a valid HTML file, for use by the Browser class.
  // Retn: AsyncQueryHelper - An asynchronous result object which will be
  //       notified when the file has finished or failed loading. (See comments
  //       in AsyncQueryHelper.gs for more information on how it's used.)
  //=============================================================================
  public native AsyncQueryHelper LoadHTMLFile(Asset asset, string htmlPageFile);


  //=============================================================================
  // Name: Print
  // Desc: Appends the passed text to the end of the buffer.
  //=============================================================================
  public native void Print(string s);


  //=============================================================================
  // Name: Escape
  // Desc: Performs HTML escaping of the the passed text, then appends it to the
  //       end of the buffer.
  //=============================================================================
  public native void Escape(string s);


  //=============================================================================
  // Name: Clear
  // Desc: Clears this buffer entirely.
  //=============================================================================
  public native void Clear(void);


  //=============================================================================
  // Name: IsEmpty
  // Desc: Returns whether this buffer is clear/empty.
  //=============================================================================
  public native bool IsEmpty(void);


  //=============================================================================
  // Name: ConvertToPlainText
  // Desc: Converts this HTML buffer to plain text by stripping all HTML markup.
  //       Specific results may vary. This will:
  //        * Remove text formatting markup (e.g. <font>, <b>, <i>, etc)
  //        * Convert <p> and <br> tags to standard new line characters
  //        * Strip new line characters that would not be displayed in HTML
  //        * Convert "&gt", "&lt", "&amp", etc to their plain text equivalents
  //        * Strip <trainz-object>, <trainz-text>, <img>, <rect>, etc. tags
  //        * Strip all <table> tags, but leave any content and add each table
  //          cell on a new line
  //        * Strip all links, but leave any wrapped link text as is
  //       The result will be unformatted and may be missing critical information
  //       or components required for it's intended function. This is meant as a
  //       last resort for displaying instructions or similar in legacy Sessions.
  //=============================================================================
  public native void ConvertToPlainText(void);


  //=============================================================================
  // Name: AsString
  // Desc: Returns the contents of the buffer as a string.
  //=============================================================================
  public native string AsString(void);


};



//=============================================================================
// Name: HTMLBufferStatic
// Desc: A static class used to create instances of HTMLBuffer.
//=============================================================================
static class HTMLBufferStatic
{
  //=============================================================================
  // Name: Construct
  // Desc: Constructs and returns a new HTMLBuffer.
  //=============================================================================
  public native HTMLBuffer Construct(void);

};

