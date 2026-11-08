Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Collections.Generic;
public static class ReferenceAssets {
 public static void Extract(string input,string output,int x,int y,int w,int h,bool logo) {
  using(var source=new Bitmap(input)) using(var result=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
   using(var g=Graphics.FromImage(result))g.DrawImage(source,new Rectangle(0,0,w,h),new Rectangle(x,y,w,h),GraphicsUnit.Pixel);
   var queue=new Queue<Point>(); var seen=new bool[w,h];
   for(int a=0;a<w;a++){queue.Enqueue(new Point(a,0));queue.Enqueue(new Point(a,h-1));}
   for(int a=0;a<h;a++){queue.Enqueue(new Point(0,a));queue.Enqueue(new Point(w-1,a));}
   while(queue.Count>0){var p=queue.Dequeue();if(p.X<0||p.X>=w||p.Y<0||p.Y>=h||seen[p.X,p.Y])continue;seen[p.X,p.Y]=true;var c=result.GetPixel(p.X,p.Y);bool background=logo?(c.B>135&&c.G>115&&c.B>c.R+12):(c.R>165&&c.G>165&&c.B>145);if(!background)continue;result.SetPixel(p.X,p.Y,Color.Transparent);queue.Enqueue(new Point(p.X-1,p.Y));queue.Enqueue(new Point(p.X+1,p.Y));queue.Enqueue(new Point(p.X,p.Y-1));queue.Enqueue(new Point(p.X,p.Y+1));}
   result.Save(output,ImageFormat.Png);
  }
 }
}
'@
$projectRoot = Split-Path $PSScriptRoot -Parent
$referenceImage=Join-Path $projectRoot 'ChatGPT Image Nov 4, 2026, 04_11_45 PM.png'
[ReferenceAssets]::Extract($referenceImage,(Join-Path $projectRoot 'public\assets\logo.png'),94,105,171,69,$true)
[ReferenceAssets]::Extract($referenceImage,(Join-Path $projectRoot 'public\assets\cartridge-ai.png'),509,592,115,109,$false)
[ReferenceAssets]::Extract($referenceImage,(Join-Path $projectRoot 'public\assets\cartridge-english.png'),116,590,113,111,$false)
[ReferenceAssets]::Extract($referenceImage,(Join-Path $projectRoot 'public\assets\cartridge-excel.png'),516,730,116,101,$false)
[ReferenceAssets]::Extract($referenceImage,(Join-Path $projectRoot 'public\assets\cartridge-brain.png'),124,729,120,103,$false)

[ReferenceAssets]::Extract((Join-Path $projectRoot 'ChatGPT Image Nov 4, 2026, 04_11_52 PM.png'),(Join-Path $projectRoot 'public\assets\star.png'),657,506,64,65,$false)

# The app icon is maintained independently by export-app-icon.ps1.
