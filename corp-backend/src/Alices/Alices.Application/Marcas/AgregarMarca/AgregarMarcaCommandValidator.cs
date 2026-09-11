using FluentValidation;

namespace Alices.Application.Marcas.AgregarMarca;

public sealed class AgregarMarcaCommandValidator : AbstractValidator<AgregarMarcaCommand>
{
    public AgregarMarcaCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de marca es obligatorio")
            .MaximumLength(20).WithMessage("El código de marca no puede superar 20 caracteres");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de marca es obligatorio")
            .MaximumLength(100).WithMessage("El nombre de marca no puede superar 100 caracteres");
    }
}
