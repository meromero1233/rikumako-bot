import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { CATEGORIES } from '../config.js';

export async function setupServer(guild) {
  const log = [];

  for (const category of CATEGORIES) {
    let catChannel = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === category.name,
    );

    if (!catChannel) {
      catChannel = await guild.channels.create({
        name: category.name,
        type: ChannelType.GuildCategory,
      });
      log.push(`✅ カテゴリー作成: ${category.name}`);
    }

    for (const ch of category.channels) {
      const type = ch.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
      const exists = guild.channels.cache.find((c) => c.name === ch.name && c.type === type);

      if (!exists) {
        await guild.channels.create({
          name: ch.name,
          type,
          parent: catChannel.id,
          topic: ch.topic ?? '',
        });
        log.push(`  ✅ チャンネル作成: #${ch.name}`);
      }
    }
  }

  return log;
}
