import type {
  AnySelectMenuInteraction,
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Awaitable,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  SharedSlashCommand,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import type {  MangaBotClient } from './client';

export interface MangaBotCommandOptions {
  builder: SharedSlashCommand;
  defer: boolean;
  ephemeral: boolean;
  modals?: Record<string, ModalBuilder>;
  execute: (
    this: MangaBotClient,
    interaction: ChatInputCommandInteraction<'cached'>
  ) => Awaitable<void>;
  onAutocomplete?: (
    this: MangaBotClient,
    interaction: AutocompleteInteraction<'cached'>
  ) => Awaitable<readonly ApplicationCommandOptionChoiceData[]>;
  onButton?: (
    this: MangaBotClient,
    interaction: ButtonInteraction<'cached'>,
    buttonId: string
  ) => Awaitable<void>;
  onModalSubmit?: (
    this: MangaBotClient,
    interaction: ModalSubmitInteraction<'cached'>,
    modalId: string
  ) => Awaitable<void>;
  onSelectMenu?: (
    this: MangaBotClient,
    interaction: AnySelectMenuInteraction<'cached'>,
    menuId: string
  ) => Awaitable<void>;
}

export class MangaBotCommand implements MangaBotCommandOptions {
  builder: SharedSlashCommand;
  defer: boolean;
  ephemeral: boolean;
  modals?: Record<string, ModalBuilder>;
  execute: (
    this: MangaBotClient,
    interaction: ChatInputCommandInteraction<'cached'>
  ) => Awaitable<void>;

  onAutocomplete?: (
    this: MangaBotClient,
    interaction: AutocompleteInteraction<'cached'>
  ) => Awaitable<readonly ApplicationCommandOptionChoiceData[]>;

  onButton?: (
    this: MangaBotClient,
    interaction: ButtonInteraction<'cached'>,
    buttonId: string
  ) => Awaitable<void>;

  onModalSubmit?: (
    this: MangaBotClient,
    interaction: ModalSubmitInteraction<'cached'>,
    modalId: string
  ) => Awaitable<void>;

  onSelectMenu?: (
    this: MangaBotClient,
    interaction: AnySelectMenuInteraction<'cached'>,
    menuId: string
  ) => Awaitable<void>;

  constructor(options: MangaBotCommandOptions) {
    this.builder = options.builder;
    this.defer = options.defer;
    this.ephemeral = options.ephemeral;
    this.modals = options.modals;
    this.execute = options.execute;
    this.onAutocomplete = options.onAutocomplete;
    this.onButton = options.onButton;
    this.onModalSubmit = options.onModalSubmit;
    this.onSelectMenu = options.onSelectMenu;
  }
}

export interface MangaBotSubCommand<T = undefined> {
  builder: SlashCommandSubcommandBuilder;
  execute(
    this: MangaBotClient,
    interaction: ChatInputCommandInteraction<'cached'>,
    ..._: T extends undefined ? [undefined?] : [data: T]
  ): Awaitable<boolean | void>;
  onAutocomplete?: (
    this: MangaBotClient,
    interaction: AutocompleteInteraction<'cached'>
  ) => Awaitable<readonly ApplicationCommandOptionChoiceData[]>;
  onButton?: (
    this: MangaBotClient,
    interaction: ButtonInteraction<'cached'>,
    buttonId: string
  ) => Awaitable<void>;
  onModalSubmit?: (
    this: MangaBotClient,
    interaction: ModalSubmitInteraction<'cached'>,
    modalId: string
  ) => Awaitable<void>;
  onSelectMenu?: (
    this: MangaBotClient,
    interaction: AnySelectMenuInteraction<'cached'>,
    menuId: string
  ) => Awaitable<void>;
}