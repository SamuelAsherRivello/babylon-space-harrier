/**
 * ClassTemplate - Tbd...
 *
 */
export class ClassTemplate
{

  /**
   * Example property.
   */
  public name: string;

  /**
   * Example private property.
   */
  private _id: number;

  /**
   * Creates a new instance of ClassTemplate.
   * @param name - The name for this instance.
   * @param id - The id for this instance.
   */
  constructor(name: string, id: number)
  {

    this.name = name;
    this._id = id;
    this.initialize();

  }

  /**
   * Example initialization method.
   */
  protected initialize(): void
  {
    // Initialization logic here

  }

  /**
   * Example public method.
   */
  public greet(): string
  {
    return `Hello, ${this.name}!`;
  }

  /**
   * Example protected method.
   */
  protected getId(): number
  {
    return this._id;
  }

}