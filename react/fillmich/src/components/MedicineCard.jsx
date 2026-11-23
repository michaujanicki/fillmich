function MedicineCard({ medicine }) {
    return (
        <article>
            <div>Lek</div>
            <h3>{medicine.NazwaProduktuLeczniczego}</h3>
            <p>{medicine.NazwaPowszechnieStosowana}</p>

            <ul>
                <li>ID: {medicine.IdentyfikatorProduktuLeczniczego}</li>
                <li>Droga podania: {medicine.DrogaPodania}</li>
                <li>Opakowanie: {medicine.Opakowanie}</li>
                <li>Substancja czynna: {medicine.SubstancjaCzynna}</li>
            </ul>

            {medicine.Ulotka && (
                <a href={medicine.Ulotka} target="_blank" rel="noopener noreferrer">
                    Ulotka
                </a>
            )}

            <section>
                <h4>Informacje dla pacjenta:</h4>
                <p>Termin ważności: {medicine.TerminWaznosci}</p>
            </section>
        </article>
    );
}

export default MedicineCard;