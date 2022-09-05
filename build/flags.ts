import fs from 'fs';
import sharp from 'sharp';
import Spritesmith from 'spritesmith';

type SpritesmithResult = {
  image: Buffer;
  coordinates: Record<string, unknown>;
};

class Flags {
  private static readonly config = {
    sourcePath: './node_modules/flag-icons/flags/4x3',
    temporaryDirPath: './build/tmp',
    targetPath: './dist/flags.webp',
    flagWidth: 32,
    flagHeight: 24,
  };

  public static async run() {
    const tmp: string[] = [];

    fs.rmSync(this.config.temporaryDirPath, { recursive: true, force: true });
    fs.mkdirSync(this.config.temporaryDirPath, { recursive: true });
    fs.mkdirSync('dist', { recursive: true });

    const filenames = fs
      .readdirSync(this.config.sourcePath)
      .filter((name) => name.length === 6);

    for (const filename of filenames) {
      const iso = filename.split('.')[0];
      tmp.push(iso);
      await sharp(fs.readFileSync(`${this.config.sourcePath}/${filename}`))
        .resize(this.config.flagWidth, this.config.flagHeight)
        .png()
        .toFile(`${this.config.temporaryDirPath}/${iso}.png`);
    }

    const sprites = tmp.map(
      (filename) => `${this.config.temporaryDirPath}/${filename}.png`,
    );
    Spritesmith.run(
      { src: sprites, algorithm: 'top-down' },
      async (_, result: SpritesmithResult) => {
        fs.writeFileSync(
          this.config.targetPath,
          await sharp(result.image).webp().toBuffer(),
        );
        const properties = Object.keys(result.coordinates);

        let str = '';
        for (let i = 0; i < properties.length; i++) {
          const key = properties[i];
          const iso = key
            .split(this.config.temporaryDirPath + '/')[1]
            .split('.')[0];
          str += `.flag-${iso} { background-position: 0 $pi-flag-height * ${-i} }\n`;
        }

        fs.writeFileSync(
          'src/style/flags.scss',
          `
$pi-flag-width: 24px !default;
$pi-flag-height: 16px !default;

[class*=flag-] {
  background-image: url(../flags.webp);
  background-repeat: no-repeat;
  background-size: $pi-flag-width $pi-flag-height * ${properties.length};
  display: inline-block;
  overflow: hidden;
  position: relative;
  vertical-align: middle;
  box-sizing: content-box;
}

${str}`.trim(),
        );

        fs.rmSync(this.config.temporaryDirPath, {
          recursive: true,
          force: true,
        });
      },
    );
  }
}

Flags.run();
